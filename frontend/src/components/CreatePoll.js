import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, HelpCircle, Save, ArrowLeft, Type, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CreatePoll = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [expiresIn, setExpiresIn] = useState('24'); // default 24 hours
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="text-center py-20 px-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-8 rounded-3xl max-w-lg mx-auto">
                    <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-400 mb-4">Authentication Required</h2>
                    <p className="text-amber-700 dark:text-amber-500 mb-8">Please sign in to create your own polls and join the conversation.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transition-all"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim() || options.some(opt => !opt.trim())) {
            alert('Please fill in the question and all options');
            return;
        }

        setLoading(true);
        try {
            await api.post('/polls/create', { question, options, expiresIn });
            navigate('/');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error creating poll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/')}
                className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-8 transition-colors"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to all polls
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                    <h2 className="text-3xl font-bold mb-2">Create New Poll</h2>
                    <p className="opacity-90 font-medium text-blue-50">Empower people to share their voices.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                            <HelpCircle size={18} className="text-blue-600" />
                            POLL QUESTION
                        </label>
                        <textarea
                            required
                            rows="2"
                            className="w-full p-5 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 rounded-2xl outline-none transition-all text-xl font-semibold dark:text-white placeholder:text-gray-400"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What's your favorite programming language?"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                            <Type size={18} className="text-blue-600" />
                            POLL OPTIONS
                        </label>
                        <AnimatePresence>
                            {options.map((option, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-3 w-full"
                                >
                                    <div className="relative flex-1 group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-xs font-black flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm transition-transform group-focus-within:scale-110">
                                            {index + 1}
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-14 pr-4 py-5 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 rounded-2xl outline-none transition-all dark:text-white font-bold"
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                    </div>
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 hover:text-white hover:bg-red-500 rounded-2xl transition-all shadow-sm border border-red-100 dark:border-red-900/30 active:scale-90"
                                            title="Remove Option"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button
                            type="button"
                            onClick={addOption}
                            className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 font-bold transition-all flex items-center justify-center gap-2 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                            Add another option
                        </button>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                            <Clock size={18} className="text-blue-600" />
                            POLL DURATION
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <select
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 rounded-xl outline-none appearance-none transition-all dark:text-white font-medium cursor-pointer"
                                    value={expiresIn}
                                    onChange={(e) => setExpiresIn(e.target.value)}
                                >
                                    <option value="1">1 Hour</option>
                                    <option value="6">6 Hours</option>
                                    <option value="12">12 Hours</option>
                                    <option value="24">24 Hours (1 Day)</option>
                                    <option value="48">48 Hours (2 Days)</option>
                                    <option value="72">72 Hours (3 Days)</option>
                                    <option value="168">168 Hours (1 Week)</option>
                                    <option value="0">Indefinite (No Expiry)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <Plus size={16} className="rotate-45" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <Clock size={16} className="text-blue-600" />
                                <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                                    Poll will automatically close after {expiresIn === '0' ? 'completion' : expiresIn + ' hours'}.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-70 group"
                        >
                            <Save size={24} className="group-hover:scale-110 transition-transform" />
                            {loading ? 'Creating Poll...' : 'Publish Poll'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreatePoll;
