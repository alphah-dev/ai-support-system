// frontend/src/pages/RegisterPage.jsx (or .js)
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
// Import MUI components (ensure all needed are here)
import {
    Box, TextField, Button, Typography, Paper, Alert, CircularProgress,
    Link as MuiLink, Grid, Avatar // Added Avatar, MuiLink
} from '@mui/material';
import apiClient from '../services/api';
// Import Icon
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'; // Changed Icon for Register

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '', email: '', full_name: '', password: '', confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault(); setError(''); setSuccess(''); setLoading(true);
        // Client-side validation
        if (!formData.username || !formData.password || !formData.confirmPassword) { setError('Username, Password, and Confirm Password are required.'); setLoading(false); return; }
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
        if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return; }

        const registrationData = { username: formData.username, password: formData.password, email: formData.email || null, full_name: formData.full_name || null, };

        try {
            const response = await apiClient.post('/auth/register', registrationData);
            if (response.status === 201 && response.data) {
                 console.log("Registration successful:", response.data);
                 setSuccess(`User '${response.data.username}' created! Redirecting to login...`);
                 setTimeout(() => navigate('/login'), 3000); // Redirect after delay
            } else { setError('Registration failed. Unexpected response.'); }
        } catch (err) { console.error("Caught registration error:", err); setError(err?.message || 'Registration failed. Username or email might exist.'); }
        finally { setLoading(false); }
    };

    return (
        // Outermost Box - Apply same background styling as LoginPage
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                // --- COPY BACKGROUND STYLE FROM LoginPage ---
                backgroundImage: 'url(/pexels-pixabay-219692.jpg)', // Use your local image path
                // OR use the gradient:
                // background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e133a 0%, #2c2c54 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                // Optional overlay (keep consistent with LoginPage):
                // '&::before': { content: '""', position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.1)', zIndex: 1 },
                // --- END BACKGROUND STYLE ---
                px: 2,
            }}
        >
            {/* Registration Form Paper - Apply similar styling */}
            <Paper
                elevation={6}
                sx={{
                    padding: { xs: 3, sm: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '450px', // Can be slightly wider than login
                    borderRadius: '12px',
                    // Use semi-transparent paper background
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 30, 0.85)' // Dark semi-transparent
                        : 'rgba(255, 255, 255, 0.85)', // Light semi-transparent
                    backdropFilter: 'blur(4px)', // Optional blur
                    zIndex: 2, // Ensure form is above potential overlay
                }}
                component="form"
                onSubmit={handleSubmit}
                noValidate
            >
                {/* Use a different icon for Register */}
                 <Avatar sx={{ m: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <PersonAddAltIcon />
                 </Avatar>

                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Create Account
                </Typography>

                {/* Display Success or Error Messages */}
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

                <TextField margin="normal" required fullWidth id="username" label="Username" name="username" autoComplete="username" autoFocus value={formData.username} onChange={handleChange} disabled={loading || !!success}/>
                <TextField margin="normal" fullWidth id="email" label="Email Address (Optional)" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} disabled={loading || !!success}/>
                <TextField margin="normal" fullWidth id="full_name" label="Full Name (Optional)" name="full_name" autoComplete="name" value={formData.full_name} onChange={handleChange} disabled={loading || !!success}/>
                <TextField margin="normal" required fullWidth name="password" label="Password (min 8 chars)" type="password" id="password" autoComplete="new-password" value={formData.password} onChange={handleChange} disabled={loading || !!success}/>
                <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirm Password" type="password" id="confirmPassword" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} disabled={loading || !!success} error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''} helperText={formData.password !== formData.confirmPassword && formData.confirmPassword !== '' ? "Passwords do not match" : ""}/>

                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.2 }} disabled={loading || !!success} > {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'} </Button>

                <Grid container justifyContent="flex-end">
                    <Grid item>
                      <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                        {"Already have an account? Sign In"}
                      </MuiLink>
                    </Grid>
                </Grid>
            </Paper>
            {/* Copyright Footer - Apply same styling */}
             <Typography variant="body2" align="center" sx={{
                mt: 5, zIndex: 2,
                color: 'rgba(255, 255, 255, 0.9)', textShadow: '1px 1px 3px rgba(0,0,0,0.6)'
                }}>
                {'Copyright © '} <MuiLink color="inherit" href="#"> AI Support System </MuiLink>{' '} {new Date().getFullYear()} {'.'}
            </Typography>
        </Box>
    );
}

export default RegisterPage;