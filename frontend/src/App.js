import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PollList from './components/PollList';
import CreatePoll from './components/CreatePoll';
import PollDetails from './components/PollDetails';

function App() {
    return (
        <Router>
            <div className="container">
                <nav className="navbar">
                    <Link to="/" className="nav-brand">Polling App</Link>
                    <div className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/create" className="nav-link">Create Poll</Link>
                    </div>
                </nav>

                <div className="content">
                    <Routes>
                        <Route path="/" element={<PollList />} />
                        <Route path="/create" element={<CreatePoll />} />
                        <Route path="/polls/:id" element={<PollDetails />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
