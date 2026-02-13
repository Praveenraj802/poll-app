import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

// This component displays the details of a single poll, handles voting, and shows results.
const PollDetails = () => {
    const { id } = useParams(); // Extract poll ID from URL
    const [poll, setPoll] = useState(null);
    const [voted, setVoted] = useState(false); // Local state to track if the user has voted
    const [selectedOption, setSelectedOption] = useState(null); // Track which option was selected

    // Fetch poll details and check local storage
    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const res = await api.get(`/${id}`);
                setPoll(res.data);

                // Check if user has already voted on this poll (LocalStorage)
                const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
                if (votedPolls[id] !== undefined) {
                    setVoted(true);
                    setSelectedOption(votedPolls[id]);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPoll();
    }, [id]);

    // Handle voting for a specific option index
    const handleVote = async (index) => {
        try {
            const res = await api.post(`/${id}/vote`, { optionIndex: index });
            setPoll(res.data); // Update local poll state with new vote counts

            // Save to LocalStorage
            const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
            votedPolls[id] = index;
            localStorage.setItem('voted_polls', JSON.stringify(votedPolls));

            setSelectedOption(index); // Track the selected option
            setVoted(true);    // Switch view to show results
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error voting');
        }
    };

    // Handle removing a vote
    const handleRemoveVote = async () => {
        if (selectedOption === null) return;
        try {
            const res = await api.post(`/${id}/remove-vote`, { optionIndex: selectedOption });
            setPoll(res.data);

            // Remove from LocalStorage
            const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
            delete votedPolls[id];
            localStorage.setItem('voted_polls', JSON.stringify(votedPolls));

            setVoted(false);
            setSelectedOption(null);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error removing vote');
        }
    };

    // Handle removing an option (must have at least 2 left)
    const handleRemoveOption = async (index) => {
        if (!window.confirm('Are you sure you want to remove this option? All votes for it will be lost.')) return;
        try {
            const res = await api.delete(`/${id}/options/${index}`);
            setPoll(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error removing option');
        }
    };

    if (!poll) return <div>Loading...</div>;

    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

    return (
        <div className="card">
            <h2>{poll.question}</h2>

            {voted ? (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Results</h3>
                        <span style={{ fontSize: '0.8rem', background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                            ✓ Voted
                        </span>
                    </div>
                    {poll.options.map((opt, i) => {
                        const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                        return (
                            <div key={i} style={{ marginBottom: '20px' }}>
                                <div className="result-stat">
                                    <span>{opt.text}</span>
                                    <span>{opt.votes} votes ({percentage}%)</span>
                                </div>
                                <div className="result-bar-container">
                                    <div
                                        className="result-bar"
                                        style={{
                                            width: `${percentage}%`,
                                            background: i % 2 === 0 ? 'linear-gradient(90deg, #6366f1, #a855f7)' : 'linear-gradient(90deg, #ec4899, #f43f5e)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                        Total Votes: {totalVotes}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <button className="btn" onClick={handleRemoveVote} style={{ background: '#dc3545' }}>
                            Remove My Vote
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <p>Select an option to vote:</p>
                    {poll.options.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                            <button className="option-btn" onClick={() => handleVote(i)} style={{ flex: 1, marginBottom: 0 }}>
                                {opt.text}
                            </button>
                            {poll.options.length > 2 && (
                                <button
                                    className="btn-delete"
                                    onClick={() => handleRemoveOption(i)}
                                    title="Remove Option"
                                    style={{ padding: '0 15px', color: '#dc3545' }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PollDetails;
