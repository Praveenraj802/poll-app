import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vote, LogOut, PlusCircle, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-blue-600 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                        <Vote size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        PollMaster
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link
                                to="/create"
                                className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                            >
                                <PlusCircle size={20} />
                                Create Poll
                            </Link>

                            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

                            <div className="flex items-center gap-3">
                                <span className="hidden sm:inline-block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {user.username}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 p-2 px-3 rounded-xl transition-all font-medium border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                                >
                                    <LogOut size={18} />
                                    <span className="hidden xs:inline">Logout</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-4 py-2 transition-colors"
                            >
                                <LogIn size={18} />
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                <UserPlus size={18} />
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
