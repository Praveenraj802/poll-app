import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, ArrowLeft, CheckCircle2, Users, Trash2, RotateCcw, Loader2, BarChart, Clock, AlertCircle, Share2, Link, MessageCircle, Twitter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PollDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voted, setVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isVoting, setIsVoting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const shareUrl = window.location.href;
    const shareText = `Vote on this poll: ${poll?.question}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const shareLinks = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    };

    const getTimeRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h remaining`;
        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
        return `${seconds}s remaining`;
    };

    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const res = await api.get(`/polls/${id}`);
                setPoll(res.data);
                setTimeLeft(getTimeRemaining(res.data.expiresAt));

                const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
                if (votedPolls[id] !== undefined) {
                    setVoted(true);
                    setSelectedOption(votedPolls[id]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPoll();

        // Update countdown every second
        const timer = setInterval(() => {
            if (poll?.expiresAt) {
                setTimeLeft(getTimeRemaining(poll.expiresAt));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [id, poll?.expiresAt]);

    const handleVote = async (index) => {
        setIsVoting(true);
        try {
            const res = await api.post(`/polls/${id}/vote`, { optionIndex: index });
            setPoll(res.data);

            const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
            votedPolls[id] = index;
            localStorage.setItem('voted_polls', JSON.stringify(votedPolls));

            setSelectedOption(index);
            setVoted(true);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error voting');
        } finally {
            setIsVoting(false);
        }
    };

    const handleRemoveVote = async () => {
        if (selectedOption === null) return;
        setIsVoting(true);
        try {
            const res = await api.post(`/polls/${id}/remove-vote`, { optionIndex: selectedOption });
            setPoll(res.data);

            const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
            delete votedPolls[id];
            localStorage.setItem('voted_polls', JSON.stringify(votedPolls));

            setVoted(false);
            setSelectedOption(null);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error removing vote');
        } finally {
            setIsVoting(false);
        }
    };

    const handleRemoveOption = async (index) => {
        if (!window.confirm('Are you sure you want to remove this option?')) return;
        try {
            const res = await api.delete(`/polls/${id}/options/${index}`);
            setPoll(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error removing option');
        }
    };

    const handleDeletePoll = async () => {
        if (!window.confirm('PERMANENTLY DELETE POLL?\n\nThis action cannot be undone.')) return;

        setLoading(true);
        try {
            await api.delete(`/polls/${id}`);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error deleting poll');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium">Loading poll details...</p>
            </div>
        );
    }

    if (!poll) return <div className="text-center py-20 text-gray-500">Poll not found.</div>;

    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

    return (
        <div className="max-w-4xl mx-auto px-4">
            <button
                onClick={() => navigate('/')}
                className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-8 transition-colors"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to all polls
            </button>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
                <div className="p-10 md:p-14">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {timeLeft === 'Expired' ? (
                            <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-red-100 dark:border-red-900/50 flex items-center gap-1.5">
                                <AlertCircle size={14} />
                                Closed
                            </span>
                        ) : (
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-blue-100 dark:border-blue-900/50">
                                Active Poll
                            </span>
                        )}

                        {timeLeft && timeLeft !== 'Expired' && (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm font-bold bg-amber-50 dark:bg-amber-900/10 px-3 py-1 rounded-lg">
                                <Clock size={16} />
                                {timeLeft}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-sm font-medium ml-auto">
                            <Users size={16} />
                            {totalVotes} participants
                        </div>

                        {user && poll.creator && (String(poll.creator) === String(user.id) || String(poll.creator) === String(user._id)) && (
                            <button
                                onClick={handleDeletePoll}
                                className="ml-4 flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-red-100"
                            >
                                <Trash2 size={14} />
                                Delete Poll
                            </button>
                        )}
                    </div>

                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-10 leading-tight">
                        {poll.question}
                    </h2>

                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {voted ? (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-8">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <BarChart className="text-blue-600" size={24} />
                                            Real-time Results
                                        </h3>
                                        <span className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold">
                                            <CheckCircle2 size={18} />
                                            Your vote is cast
                                        </span>
                                    </div>

                                    {poll.options.map((opt, i) => {
                                        const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                                        const isSelected = selectedOption === i;
                                        return (
                                            <div key={i} className="space-y-3">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className={`font-bold flex items-center gap-2 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {opt.text}
                                                        {isSelected && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Your choice</span>}
                                                    </span>
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                                        {opt.votes} <span className="text-gray-400 font-medium">voted</span> • {percentage}%
                                                    </span>
                                                </div>
                                                <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden relative">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={`h-full relative rounded-full ${isSelected ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                                    >
                                                        {isSelected && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                                    </motion.div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="flex flex-col items-center gap-4 mt-12 pt-8 border-t border-gray-50 dark:border-gray-700">
                                        <button
                                            className="flex items-center gap-2 text-gray-400 hover:text-red-500 font-bold text-sm transition-all"
                                            onClick={handleRemoveVote}
                                            disabled={isVoting}
                                        >
                                            <RotateCcw size={16} />
                                            Reset my vote and vote again
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="voting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="grid grid-cols-1 gap-4"
                                >
                                    {poll.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            disabled={isVoting || timeLeft === 'Expired'}
                                            onClick={() => handleVote(i)}
                                            className={`group relative flex items-center justify-between p-6 rounded-[1.5rem] transition-all text-left shadow-sm border-2 
                                                ${timeLeft === 'Expired'
                                                    ? 'bg-gray-50 dark:bg-gray-800/50 border-transparent cursor-not-allowed grayscale-[0.5]'
                                                    : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 border-transparent hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10'
                                                }`}
                                        >
                                            <span className={`text-lg font-bold transition-colors ${timeLeft === 'Expired' ? 'text-gray-400' : 'text-gray-800 dark:text-gray-200 group-hover:text-blue-600'}`}>
                                                {opt.text}
                                            </span>
                                            <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-600 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                                                <Vote size={20} className="text-gray-300 group-hover:text-white transition-colors" />
                                            </div>
                                            {user && poll.creator === user.id && (
                                                <button
                                                    className="absolute -right-2 -top-2 p-2 bg-white dark:bg-gray-700 text-gray-300 hover:text-red-500 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveOption(i);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* SHARE SECTION */}
                    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                                    <Share2 size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Share this Poll</h4>
                                    <p className="text-sm text-gray-500">Get more people to participate!</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={handleCopyLink}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border-2 ${copySuccess
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600'
                                        }`}
                                >
                                    {copySuccess ? <CheckCircle2 size={18} /> : <Link size={18} />}
                                    {copySuccess ? 'Copied!' : 'Copy Link'}
                                </button>

                                <a
                                    href={shareLinks.whatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                    title="Share on WhatsApp"
                                >
                                    <MessageCircle size={24} />
                                </a>

                                <a
                                    href={shareLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-black hover:bg-gray-800 text-white rounded-xl transition-all shadow-lg shadow-gray-500/20"
                                    title="Share on X (Twitter)"
                                >
                                    <Twitter size={24} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div >
            </motion.div >
        </div >
    );
};

export default PollDetails;
