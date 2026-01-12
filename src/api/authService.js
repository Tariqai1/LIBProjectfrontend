// src/api/authService.js
import apiClient from './apiClient';

/**
 * Logs in a user by sending credentials to the backend.
 */
const login = async (username, password) => {
    try {
        // FastAPI expects form-data for OAuth2
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        // --- IMPORTANT FIX ---
        // Changed endpoint from '/token' to '/api/token' to match backend router
        const response = await apiClient.post('/api/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        // --- AUTO SAVE TOKEN ---
        // Save the token immediately upon success
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            // Save user details (role, username, etc.) if available in response
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        
        return response.data;
        
    } catch (error) {
        console.error("API login error:", error.response?.data || error.message);
        throw error.response?.data || new Error('API login failed');
    }
};

/**
 * Logs out the user.
 */
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; // Redirect to login
};

/**
 * Get current user info from local storage
 */
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};

export const authService = {
    login,
    logout,
    getCurrentUser
};