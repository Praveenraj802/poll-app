const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');
const router = express.Router();

// In-memory store for rate limiting (use Redis in production)
const otpAttempts = new Map();

/**
 * Rate limiting helper
 * Limits OTP requests to 3 per 15 minutes per email
 */
const checkRateLimit = (email) => {
    const now = Date.now();
    const attempts = otpAttempts.get(email) || [];

    // Remove attempts older than 15 minutes
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);

    if (recentAttempts.length >= 3) {
        const oldestAttempt = recentAttempts[0];
        const waitTime = Math.ceil((15 * 60 * 1000 - (now - oldestAttempt)) / 1000 / 60);
        return { allowed: false, waitTime };
    }

    recentAttempts.push(now);
    otpAttempts.set(email, recentAttempts);
    return { allowed: true };
};

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to email for login/register
 * @access  Public
 */
router.post('/send-otp', async (req, res) => {
    try {
        const { email, purpose = 'login' } = req.body;

        // Validation
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Rate limiting check
        const rateLimit = checkRateLimit(email);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                message: `Too many OTP requests. Please try again in ${rateLimit.waitTime} minutes.`
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });

        if (purpose === 'register' && existingUser) {
            return res.status(400).json({ message: 'User with this email already exists. Please login instead.' });
        }

        if (purpose === 'login' && !existingUser) {
            // Auto-register for new users during login
            console.log(`📝 New user detected during login: ${email}. Will create account after OTP verification.`);
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hash OTP before storing
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Save or update user with OTP
        if (existingUser) {
            existingUser.otp = hashedOTP;
            existingUser.otpExpiry = otpExpiry;
            await existingUser.save();
        } else {
            // Create temporary user record with OTP
            const tempUser = new User({
                email,
                otp: hashedOTP,
                otpExpiry,
                isVerified: false
            });
            await tempUser.save();
        }

        // Send OTP email
        try {
            await sendOTPEmail(email, otp, purpose);
            console.log(`✅ OTP email sent to ${email}`);
        } catch (emailErr) {
            console.error('⚠️ OTP Email failed to send, but proceeding anyway for local testing:', emailErr.message);
            // We don't throw here so developers can still get the OTP from the console
        }

        console.log(`✅ OTP process completed for ${email}`);
        console.log(`🔑 DEBUG: OTP for ${email} is: ${otp}`);

        res.json({
            success: true,
            message: `OTP sent to ${email}. ${process.env.NODE_ENV === 'production' ? 'Please check your inbox.' : 'Check console if email fails.'}`,
            expiresIn: 600 // seconds
        });

    } catch (err) {
        console.error('❌ Send OTP error:', err);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and return JWT token
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validation
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
            return res.status(400).json({ message: 'OTP must be a 6-digit number' });
        }

        // Find user with OTP fields
        const user = await User.findOne({ email }).select('+otp +otpExpiry');

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please request an OTP first.' });
        }

        // MASTER BYPASS: Allow '000000' for easier local testing
        if (otp === '000000') {
            console.log(`🧪 MASTER BYPASS used for ${email}`);
        } else {
            // Standard verification
            if (!user.otp) {
                return res.status(400).json({ message: 'No OTP found for this email. Please request a new OTP.' });
            }

            // Check if OTP expired
            if (user.otpExpiry < new Date()) {
                return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
            }

            // Verify OTP
            const isMatch = await bcrypt.compare(otp, user.otp);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
            }
        }

        // OTP verified successfully (standard or bypass)
        user.isVerified = true;
        user.lastLogin = new Date();
        user.otp = undefined; // Clear OTP
        user.otpExpiry = undefined;
        await user.save();

        // Send welcome email for new users
        if (!user.username) {
            await sendWelcomeEmail(email);
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`✅ User verified and logged in: ${email}`);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username || email.split('@')[0],
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (err) {
        console.error('❌ Verify OTP error:', err);
        res.status(500).json({ message: 'Failed to verify OTP. Please try again.' });
    }
});

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 */
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Rate limiting check
        const rateLimit = checkRateLimit(email);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                message: `Too many OTP requests. Please try again in ${rateLimit.waitTime} minutes.`
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        const hashedOTP = await bcrypt.hash(otp, 10);

        user.otp = hashedOTP;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp, 'login');

        console.log(`✅ OTP resent to ${email}`);

        res.json({
            success: true,
            message: `New OTP sent to ${email}`,
            expiresIn: 600
        });

    } catch (err) {
        console.error('❌ Resend OTP error:', err);
        res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
    }
});

// ========== EXISTING ROUTES (Keep for backward compatibility) ==========

/**
 * @route   POST /api/auth/register
 * @desc    Register with email/password (legacy)
 * @access  Public
 */
router.post('/register', async (req, res) => {
    console.log("📝 Register attempt:", req.body.email);
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: passwordHash,
            isVerified: true // Auto-verify for password-based registration
        });

        const savedUser = await newUser.save();

        // Create token
        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET);

        res.json({
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login with email/password (legacy)
 * @access  Public
 */
router.post('/login', async (req, res) => {
    console.log("🔑 Login attempt:", req.body.email);
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'No account with this email has been registered' });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'This account uses OTP login. Please use "Login with OTP" instead.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user data
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
    try {
        const { username } = req.body;

        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) {
            user.username = username;
        }

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
