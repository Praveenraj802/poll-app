import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const PollList = () => {
    const [polls, setPolls] = useState([]);

    const fetchPolls = async () => {
        try {
            const res = await api.get('/');
            setPolls(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPolls();
    }, []);

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this poll?')) return;

        try {
            await api.delete(`/${id}`);
            fetchPolls(); // Refresh list
        } catch (err) {
            console.error(err);
            alert('Error deleting poll');
        }
    };

    return (
        <div className="card">
            <h2>Active Polls</h2>
            {polls.length === 0 ? (
                <p>No polls available. <Link to="/create">Create one!</Link></p>
            ) : (
                polls.map(poll => (
                    <Link to={`/polls/${poll._id}`} key={poll._id} className="poll-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>{poll.question}</h3>
                            <p style={{ margin: '5px 0 0', color: '#666' }}>{poll.options.length} options</p>
                        </div>
                        <button
                            onClick={(e) => handleDelete(e, poll._id)}
                            className="btn"
                            style={{ background: '#dc3545', padding: '5px 10px', fontSize: '0.8rem' }}
                        >
                            Delete
                        </button>
                    </Link>
                ))
            )}
        </div>
    );
};

export default PollList;
