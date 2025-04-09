// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/api'; // Import base apiClient

// Create the context
const AuthContext = createContext(null);

// Create a provider component
export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken')); // Check localStorage on initial load
    const [user, setUser] = useState(null); // Store user info (username, etc.)
    const [isLoading, setIsLoading] = useState(true); // Track initial loading state

    // Function to set token in state and localStorage
    const setToken = (token) => {
        if (token) {
            localStorage.setItem('authToken', token); // Persist token
            // Set Authorization header for all subsequent requests
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            localStorage.removeItem('authToken'); // Clear token
            delete apiClient.defaults.headers.common['Authorization']; // Remove header
        }
        setAuthToken(token);
    };

    // Function to fetch user data when token changes (or on initial load)
    const fetchCurrentUser = async (token) => {
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }
        // Ensure header is set before making the call
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
            // Call the backend endpoint to get user info
            const response = await apiClient.get('/auth/users/me');
            setUser(response.data); // Set user state with data from backend
            console.log("Current user fetched:", response.data);
        } catch (error) {
            console.error("Failed to fetch current user:", error);
            // If fetching user fails (e.g., token expired/invalid), log out
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to load user on initial mount if token exists
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            fetchCurrentUser(token);
        } else {
            setIsLoading(false); // No token, not loading
        }
    }, []); // Empty array means run once on mount

    // Login function
    const login = async (username, password) => {
        try {
            // Use URLSearchParams for form data
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            const response = await apiClient.post('/auth/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            if (response.data.access_token) {
                const token = response.data.access_token;
                setToken(token); // Save token
                await fetchCurrentUser(token); // Fetch user info after successful login
                return true; // Indicate success
            }
            return false; // Indicate failure (though error should be caught)
        } catch (error) {
            console.error("Login failed:", error);
            setUser(null); // Clear user on failed login
            setToken(null); // Clear token on failed login
            // Re-throw or return error message?
            throw error; // Let the Login page handle displaying the error
        }
    };

    // Logout function
    const logout = () => {
        setToken(null); // Clear token from state & localStorage
        setUser(null);  // Clear user state
        // Optionally redirect user to login page (handled in App component)
        console.log("User logged out");
    };

    // Value provided by the context
    const value = {
        authToken,
        user,
        isLoading, // Provide loading state for initial check
        login,
        logout,
        // No need to expose setToken directly, use login/logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};