import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, Trash2, Plus, ArrowRight, BarChart3, Loader2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE_URL.replace('/api', '');

const PollList = () => {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const getTimeRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;

        if (diff <= 0) return 'Expired';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d left`;
        if (hours > 0) return `${hours}h left`;
        return `${minutes}m left`;
    };

    const fetchPolls = async () => {
        try {
            const res = await api.get('/polls');
            setPolls(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('voteUpdate', (updatedPoll) => {
            setPolls(prevPolls =>
                prevPolls.map(p => p._id === updatedPoll._id ? updatedPoll : p)
            );
        });

        return () => socket.disconnect();
    }, []);

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this poll?')) return;

        try {
            await api.delete(`/polls/${id}`);
            fetchPolls();
        } catch (err) {
            console.error(err);
            alert('Error deleting poll');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Loading amazing polls...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Live <span className="text-blue-600">Polls</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                        Explore and participate in community-driven decisions.
                    </p>
                </div>
                {user && (
                    <Link
                        to="/create"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        Create New Poll
                    </Link>
                )}
            </header>

            {polls.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700"
                >
                    <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Vote className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">No active polls yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Be the first to start a conversation by creating a poll.</p>
                    <Link to="/create" className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-2 underline underline-offset-4">
                        Create your first poll <ArrowRight size={18} />
                    </Link>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {polls.map((poll, index) => (
                            <motion.div
                                key={poll._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -5 }}
                            >
                                <Link to={`/polls/${poll._id}`} className="group block bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700 relative overflow-hidden h-full">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="text-blue-600" size={20} />
                                    </div>

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl">
                                            <BarChart3 className="text-blue-600" size={24} />
                                        </div>
                                        {poll.expiresAt && (
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getTimeRemaining(poll.expiresAt) === 'Expired'
                                                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                <Clock size={12} />
                                                {getTimeRemaining(poll.expiresAt)}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                        {poll.question}
                                    </h3>

                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex items-center gap-2 font-medium">
                                        <span className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 w-6 h-6 rounded-md text-[10px]">
                                            {poll.options.length}
                                        </span>
                                        options available
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600/60 dark:text-blue-400/60">
                                            View Results
                                        </span>
                                        {user && poll.creator && (String(poll.creator) === String(user.id) || String(poll.creator) === String(user._id)) && (
                                            <button
                                                onClick={(e) => handleDelete(e, poll._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                title="Delete Poll"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default PollList;
