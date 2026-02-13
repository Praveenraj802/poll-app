import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                } catch (err) {
                    console.error('Failed to load user', err);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token, API_URL]);

    const login = async (email, password) => {
        console.log("🚀 Frontend: Attempting login for", email);
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            console.log("✅ Frontend: Login Success:", res.data.user.username);
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUser(res.data.user);
            return res.data;
        } catch (err) {
            console.error("❌ Frontend: Login Error:", err.response?.data || err.message);
            throw err;
        }
    };

    const register = async (username, email, password) => {
        console.log("🚀 Frontend: Attempting registration for", email);
        try {
            const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
            console.log("✅ Frontend: registration Success:", res.data.user.username);
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUser(res.data.user);
            return res.data;
        } catch (err) {
            console.error("❌ Frontend: registration Error:", err.response?.data || err.message);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
