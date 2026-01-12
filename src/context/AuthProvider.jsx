// src/context/AuthProvider.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService'; // API service for logging in
import { userService } from '../api/userService';   // API service for fetching user data
import { jwtDecode } from 'jwt-decode'; // Package to decode the token

// Create the context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Stores the user object { id, username, role, ... }
    const [isAuth, setIsAuth] = useState(false); // Quick boolean check if logged in
    const [isLoading, setIsLoading] = useState(true); // App-load loading state
    const navigate = useNavigate();

    /**
     * This effect runs once when the app loads.
     * It checks localStorage for an existing token and validates it.
     */
    const checkAuthStatus = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // 1. Decode token to check expiration (optional but fast)
                const decodedToken = jwtDecode(token);
                if (decodedToken.exp * 1000 < Date.now()) {
                    throw new Error("Token expired");
                }
                
                // 2. Fetch user data from the backend using the token
                //    (apiClient automatically adds the token to the header)
                const userData = await userService.getMe(); // Calls GET /api/users/me/
                
                // 3. Set auth state
                setUser(userData);
                setIsAuth(true);

            } catch (e) {
                // Token is invalid, expired, or /users/me failed
                console.error("Auth status check failed:", e.message);
                localStorage.removeItem('token'); // Clear the bad token
                setIsAuth(false);
                setUser(null);
            }
        }
        // Finished checking, set loading to false
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    /**
     * Called by Login.jsx to perform the login.
     * It fetches a token, stores it, and updates the state.
     */
    const login = async (username, password) => {
        try {
            // 1. Get token from the backend
            const response = await authService.login(username, password); // Calls POST /token
            const token = response.access_token;

            // 2. Store token in localStorage
            localStorage.setItem('token', token);

            // 3. Fetch user data with the new token
            const userData = await userService.getMe(); // Calls GET /api/users/me/
            
            // 4. Update state
            setUser(userData);
            setIsAuth(true);

            return { success: true }; // Return success to Login.jsx
        } catch (err) {
            console.error("Auth login failed:", err);
            localStorage.removeItem('token'); // Clear any partial token
            setIsAuth(false);
            setUser(null);
            // Return failure with the error message
            return { success: false, error: err.detail || 'Login failed' };
        }
    };

    /**
     * Called by Logout.jsx or other components to log the user out.
     */
    const logout = () => {
        localStorage.removeItem('token');
        setIsAuth(false);
        setUser(null);
        navigate('/login', { replace: true }); // Redirect to login page
    };

    // Provide these values to all children components
    const value = {
        isAuth,
        user,
        role: user?.role?.name || null, // e.g., "Admin", "Member"
        isLoading, // Lets ProtectedRoute wait
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Only render children (the rest of the app) 
                once the initial token check is complete */}
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;