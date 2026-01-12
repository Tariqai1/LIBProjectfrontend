import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Your custom hook to access auth context
import { motion } from 'framer-motion'; // For animations

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine where to redirect after login (from previous page or default to '/')
    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setIsLoading(true); // Show loading state

        if (!username || !password) {
            setError('Please enter both username and password.');
            setIsLoading(false);
            return;
        }

        try {
            const result = await auth.login(username, password); // Call login from context

            if (result.success) {
                // Navigate to the intended page or dashboard on success
                navigate(from, { replace: true });
            } else {
                // Set error message from context/API if login fails
                setError(result.error || 'Login failed. Please check credentials.');
            }
        } catch (err) {
            // Handle unexpected errors during login attempt
            console.error("Login component error:", err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false); // Hide loading state
        }
    };

    // Animation variants for the form container
    const formVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    };

    return (
        // Full screen flex container, centered content
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 p-4">
            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 space-y-6" // Card styles
            >
                {/* Header */}
                <div className="text-center">
                     <h1 className="text-2xl font-bold text-gray-800 mb-2">📚 BookNest Login</h1>
                     <p className="text-sm text-gray-500">Welcome back! Please sign in.</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error Message Display */}
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">
                            {error}
                        </div>
                    )}

                    {/* Username Input */}
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-600 mb-1"
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading} // Disable input while loading
                            required
                            autoComplete="username"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                            placeholder="Enter your username"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-600 mb-1"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading} // Disable input while loading
                            required
                            autoComplete="current-password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
                            placeholder="Enter your password"
                        />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isLoading} // Disable button while loading
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            isLoading
                                ? 'bg-gray-400 cursor-not-allowed' // Style for loading state
                                : 'bg-blue-600 hover:bg-blue-700' // Style for normal state
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;