import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, ArrowLeft, CheckCircle2, Users, Trash2, RotateCcw, Loader2, BarChart } from 'lucide-react';
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

    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const res = await api.get(`/polls/${id}`);
                setPoll(res.data);

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
    }, [id]);

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
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-blue-100 dark:border-blue-900/50">
                            Active Poll
                        </span>
                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-sm font-medium">
                            <Users size={16} />
                            {totalVotes} participants
                        </div>
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
                                            disabled={isVoting}
                                            onClick={() => handleVote(i)}
                                            className="group relative flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 border-2 border-transparent hover:border-blue-500 rounded-[1.5rem] transition-all text-left shadow-sm hover:shadow-xl hover:shadow-blue-500/10"
                                        >
                                            <span className="text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
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
                </div>
            </motion.div>
        </div>
    );
};

export default PollDetails;
