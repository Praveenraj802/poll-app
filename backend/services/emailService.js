const nodemailer = require('nodemailer');

/**
 * Email Service for sending OTP emails
 * Uses Gmail SMTP (you can switch to SendGrid, AWS SES, etc.)
 */

// Create reusable transporter
const createTransport = async () => {
    // If credentials are provided in .env, use them
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Default: Create a fake "Ethereal" account for testing (ZERO config needed!)
    console.log("🛠️ Using Ethereal Test Email Service...");
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} purpose - 'login' or 'register'
 */
const sendOTPEmail = async (email, otp, purpose = 'login') => {
    try {
        const transporter = await createTransport();

        const subject = purpose === 'register'
            ? '🎉 Welcome to Polling App - Your OTP Code'
            : '🔐 Your Polling App Login Code';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f4f7fa;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 40px 20px;
                        text-align: center;
                        color: white;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .otp-box {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        font-size: 36px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        text-align: center;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 30px 0;
                        font-family: 'Courier New', monospace;
                    }
                    .message {
                        color: #333;
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 20px;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                        color: #856404;
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        color: #6c757d;
                        font-size: 14px;
                    }
                    .footer a {
                        color: #667eea;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🗳️ Polling App</h1>
                    </div>
                    <div class="content">
                        <p class="message">
                            ${purpose === 'register'
                ? 'Welcome! Thanks for joining Polling App. To complete your registration, please use the OTP code below:'
                : 'You requested to log in to your Polling App account. Use the OTP code below to continue:'}
                        </p>
                        
                        <div class="otp-box">
                            ${otp}
                        </div>
                        
                        <p class="message">
                            This code will expire in <strong>10 minutes</strong>.
                        </p>
                        
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong><br>
                            Never share this code with anyone. Our team will never ask for your OTP.
                        </div>
                        
                        <p class="message">
                            If you didn't request this code, please ignore this email.
                        </p>
                    </div>
                    <div class="footer">
                        <p>
                            Made with ❤️ by Polling App Team<br>
                            <a href="#">Visit our website</a> | <a href="#">Contact Support</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Polling App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP process completed for ${email}`);

        // Log the preview URL for testing
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`🔗 VIEW YOUR EMAIL HERE: ${previewUrl}`);
        }

        return { success: true, messageId: info.messageId, previewUrl };

    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw new Error('Failed to send OTP email. Please try again.');
    }
};

/**
 * Send welcome email after successful registration
 */
const sendWelcomeEmail = async (email, username) => {
    try {
        const transporter = await createTransport();

        const mailOptions = {
            from: `"Polling App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🎉 Welcome to Polling App!',
            html: `
                <h1>Welcome ${username || 'to Polling App'}!</h1>
                <p>Your account has been successfully created.</p>
                <p>You can now:</p>
                <ul>
                    <li>Create unlimited polls</li>
                    <li>Vote on community polls</li>
                    <li>Share polls with friends</li>
                    <li>View real-time results</li>
                </ul>
                <p>Get started now and make your voice heard!</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        // Don't throw error - welcome email is not critical
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendWelcomeEmail
};
