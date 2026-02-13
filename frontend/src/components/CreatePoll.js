import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// This component handles the creation of a new poll.
// It allows users to enter a question and dynamic number of options.
const CreatePoll = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']); // Default with 2 empty options
    const navigate = useNavigate();

    // Update the text of a specific option by index
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
        if (!question || options.some(opt => !opt.trim())) {
            alert('Please fill in all fields');
            return;
        }

        try {
            // Send the new poll data to the backend API at the /create endpoint
            await api.post('/create', { question, options });
            navigate('/'); // Redirect back to home after successful creation
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error creating poll');
        }
    };

    return (
        <div className="card">
            <h2>Create a New Poll</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Question:</label>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="What would you like to ask?"
                    />
                </div>

                <label>Options:</label>
                {options.map((option, index) => (
                    <div key={index} className="input-group" style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                        />
                        {options.length > 2 && (
                            <button type="button" onClick={() => removeOption(index)} className="btn" style={{ background: '#dc3545' }}>X</button>
                        )}
                    </div>
                ))}

                <button type="button" onClick={addOption} className="btn" style={{ marginRight: '10px', background: '#6c757d' }}>
                    Add Option
                </button>
                <button type="submit" className="btn">Create Poll</button>
            </form>
        </div>
    );
};

export default CreatePoll;
