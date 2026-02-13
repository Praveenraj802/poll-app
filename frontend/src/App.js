import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PollList from './components/PollList';
import CreatePoll from './components/CreatePoll';
import PollDetails from './components/PollDetails';
import Login from './components/Login';
import Register from './components/Register';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors dark">
                    <Navbar />
                    <main className="container mx-auto px-4 py-8 max-w-6xl">
                        <Routes>
                            <Route path="/" element={<PollList />} />
                            <Route path="/create" element={<CreatePoll />} />
                            <Route path="/polls/:id" element={<PollDetails />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                        </Routes>
                    </main>

                    <footer className="py-8 text-center text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-900 mt-20">
                        <p className="text-sm">© {new Date().getFullYear()} PollMaster. Built with precision and care.</p>
                    </footer>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
