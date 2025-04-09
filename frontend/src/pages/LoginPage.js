// frontend/src/pages/LoginPage.jsx (or .js)
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js'; // Use .js or .jsx
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
// Import MUI components
import {
    Box, TextField, Button, Typography, Paper, Alert, CircularProgress,
    Link as MuiLink, Grid, Avatar
} from '@mui/material';
// Import MUI Icon
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/app/dashboard';

    const handleSubmit = async (event) => {
        event.preventDefault(); setError(''); setLoading(true);
        if (!username || !password) { setError('Please enter both username and password.'); setLoading(false); return; }
        try { const success = await login(username, password); if (success) { navigate(from, { replace: true }); } else { setError('Login failed. Please check your credentials.'); } }
        catch (err) { console.error("Caught login error:", err); setError(err?.message || 'Login failed.'); }
        finally { setLoading(false); }
    };

    return (
        // Outermost Box: Full height, centering, background image from public folder
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                // --- BACKGROUND IMAGE from /public folder ---
                // Reference the image using a root path '/'
                backgroundImage: 'url(/pexels-pixabay-219692.jpg)', // <<<--- UPDATED PATH
                backgroundSize: 'cover', // Scale to cover the area
                backgroundPosition: 'center center', // Center the image
                backgroundRepeat: 'no-repeat', // Don't tile the image
                // Optional overlay:
                // '&::before': { content: '""', position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.1)', zIndex: 1 },
                // --- END BACKGROUND ---
                px: 2, // Horizontal padding
            }}
        >
            {/* Login Form Paper */}
            <Paper
                elevation={6}
                sx={{
                    padding: { xs: 3, sm: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '12px',
                    // Semi-transparent paper background
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(30, 30, 30, 0.85)' // Dark semi-transparent
                        : 'rgba(255, 255, 255, 0.85)', // Light semi-transparent
                    backdropFilter: 'blur(4px)', // Optional blur
                    zIndex: 2,
                }}
                component="form"
                onSubmit={handleSubmit}
                noValidate
            >
                 <Avatar sx={{ m: 1, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
                    <LockOutlinedIcon />
                 </Avatar>
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Sign In
                </Typography>

                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                <TextField margin="normal" required fullWidth id="username" label="Username" name="username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading}/>
                <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}/>
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.2 }} disabled={loading} > {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'} </Button>
                <Grid container justifyContent="flex-end">
                    <Grid item>
                      <MuiLink component={RouterLink} to="/register" variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                        {"Don't have an account? Sign Up"}
                      </MuiLink>
                    </Grid>
                </Grid>
            </Paper>
            {/* Copyright Footer */}
            <Typography variant="body2" align="center" sx={{
                mt: 5, zIndex: 2,
                 // Adjust color/shadow for visibility over *your specific* background
                 color: 'rgba(255, 255, 255, 0.9)', // Example: Light text
                 textShadow: '1px 1px 3px rgba(0,0,0,0.6)' // Example: Shadow
                }}>
                {'Copyright © '}
                <MuiLink color="inherit" href="#" sx={{ fontWeight: 'bold' }}> AI Support System </MuiLink>{' '}
                {new Date().getFullYear()} {'.'}
            </Typography>
        </Box>
    );
}

export default LoginPage;