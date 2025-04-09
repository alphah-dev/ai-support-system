// frontend/src/pages/RegisterPage.jsx (or .js)
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Import Link for navigation
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress, Link } from '@mui/material';
import apiClient from '../services/api'; // Import base apiClient directly

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '', // Optional
        full_name: '', // Optional
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // For success message
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Basic client-side validation
        if (!formData.username || !formData.password || !formData.confirmPassword) {
            setError('Please fill in username, password, and confirm password.');
            setLoading(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        if (formData.password.length < 8) {
             setError('Password must be at least 8 characters long.');
             setLoading(false);
             return;
        }
        // More complex validation (e.g., email format) can be added

        // Prepare data for API (exclude confirmPassword)
        const registrationData = {
            username: formData.username,
            password: formData.password,
            email: formData.email || null, // Send null if empty
            full_name: formData.full_name || null, // Send null if empty
        };

        try {
            // Call the backend /auth/register endpoint
            const response = await apiClient.post('/auth/register', registrationData);

            if (response.status === 201 && response.data) {
                 console.log("Registration successful:", response.data);
                 setSuccess(`User '${response.data.username}' created successfully! You can now log in.`);
                 // Optionally redirect after a short delay or keep them here
                 setTimeout(() => {
                     navigate('/login'); // Redirect to login page after success
                 }, 3000); // 3 second delay
            } else {
                 // Should be caught by catch block via interceptor, but handle defensively
                 setError('Registration failed. Please try again.');
            }

        } catch (err) {
            console.error("Caught registration error in RegisterPage:", err);
            // Use the error message provided by the API interceptor or default
            setError(err?.message || 'Registration failed. Username or email might already exist.');
        } finally {
            setLoading(false);
            // Clear password fields after attempt?
            // setFormData(prev => ({...prev, password: '', confirmPassword: ''}));
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: (theme) => theme.palette.background.default,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '450px', // Slightly wider for more fields
                }}
                component="form"
                onSubmit={handleSubmit}
                noValidate
            >
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Create Account
                </Typography>

                {/* Display Success or Error Messages */}
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading || !!success} // Disable if loading or successful
                />
                 <TextField
                    margin="normal"
                    fullWidth // Optional field
                    id="email"
                    label="Email Address (Optional)"
                    name="email"
                    type="email" // Use email type for basic validation
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading || !!success}
                />
                 <TextField
                    margin="normal"
                    fullWidth // Optional field
                    id="full_name"
                    label="Full Name (Optional)"
                    name="full_name"
                    autoComplete="name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading || !!success}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password (min 8 chars)"
                    type="password"
                    id="password"
                    autoComplete="new-password" // Use new-password hint
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading || !!success}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    id="confirmPassword"
                    autoComplete="new-password" // Use new-password hint
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading || !!success}
                    error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''} // Show error if mismatch and confirm has content
                    helperText={formData.password !== formData.confirmPassword && formData.confirmPassword !== '' ? "Passwords do not match" : ""}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading || !!success} // Disable if loading or success
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                </Button>
                <Link component={RouterLink} to="/login" variant="body2">
                    {"Already have an account? Sign In"}
                </Link>
            </Paper>
        </Box>
    );
}

export default RegisterPage;