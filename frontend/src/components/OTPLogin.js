import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldCheck, ArrowRight, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OTPLogin = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [timer, setTimer] = useState(60);

    const { sendOTP, verifyOTP, resendOTP } = useAuth();
    const navigate = useNavigate();

    const startTimer = () => {
        setResendDisabled(true);
        setTimer(60);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setResendDisabled(false);
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await sendOTP(email);
            setStep(2);
            startTimer();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await verifyOTP(email, otpString);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendDisabled) return;
        setError('');
        try {
            await resendOTP(email);
            startTimer();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 overflow-hidden relative"
            >
                {/* Decorative gradients */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="text-center mb-10 relative">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 mb-4 transition-transform hover:scale-110">
                        {step === 1 ? <Mail size={32} /> : <ShieldCheck size={32} />}
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {step === 1 ? 'Login with OTP' : 'Verify Identity'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {step === 1
                            ? 'Enter your email to receive a secure code'
                            : `We've sent a 6-digit code to ${email}`}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400"
                        >
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="text-sm font-semibold">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {step === 1 ? (
                    <motion.form
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleSendOTP}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent border-gray-100 dark:border-gray-600 rounded-2xl focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all dark:text-white placeholder:text-gray-400"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Send Verification Code
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </motion.form>
                ) : (
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleVerifyOTP}
                        className="space-y-8"
                    >
                        <div className="flex justify-between gap-2 px-1">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    className="w-full aspect-square text-center text-2xl font-bold bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all dark:text-white"
                                    value={data}
                                    onChange={(e) => handleOtpChange(e.target, index)}
                                    onFocus={(e) => e.target.select()}
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Verify & Login
                                        <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Change Email
                                </button>
                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                <button
                                    type="button"
                                    disabled={resendDisabled}
                                    onClick={handleResend}
                                    className={`text-sm font-semibold flex items-center gap-2 transition-colors ${resendDisabled
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-blue-600 hover:text-blue-700'
                                        }`}
                                >
                                    <RefreshCw size={14} className={resendDisabled ? '' : 'animate-spin-slow'} />
                                    {resendDisabled ? `Resend in ${timer}s` : 'Resend Code'}
                                </button>
                            </div>

                            {/* DEVELOPER AUTO-LOGIN BUTTON */}
                            <div className="pt-4 mt-4 border-t border-dashed border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            await verifyOTP(email, '000000');
                                            navigate('/');
                                        } catch (err) {
                                            setError('Bypass failed');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="w-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold py-3 rounded-xl border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 transition-all text-sm flex items-center justify-center gap-2"
                                >
                                    🧪 Developer Auto-Login (Skip OTP)
                                </button>
                            </div>
                        </div>
                    </motion.form>
                )}

                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                        Prefer old school?{' '}
                        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold underline-offset-4 hover:underline">
                            Login with password
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default OTPLogin;
