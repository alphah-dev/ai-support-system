// frontend/src/pages/CreateTicketPage.jsx (or .js)
import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Select, MenuItem, InputLabel, FormControl, Grid, CircularProgress, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../services/api'; // Import the API function

function CreateTicketPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        subject: '',
        body: '',
        priority: 'Medium', // Default priority
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successInfo, setSuccessInfo] = useState(null); // To store info of created ticket
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSnackbarClose = (event, reason) => {
         if (reason === 'clickaway') { return; }
         setSnackbarOpen(false);
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessInfo(null);
        setLoading(true);

        // Basic Validation
        if (!formData.customer_name || !formData.subject || !formData.body) {
             setError('Please fill in Customer Name, Subject, and Body.');
             setLoading(false);
             return;
        }

        try {
            // Call the API - createTicket expects the data object
            const response = await createTicket(formData);

            if (response.status === 201 && response.data) {
                console.log('Ticket created successfully:', response.data);
                // Store response data to show summary/actions briefly
                setSuccessInfo({
                     id: response.data.id,
                     summary: response.data.summary || '(Summary not available)',
                     actions: response.data.extracted_actions || ['(Actions not available)']
                });
                setSnackbarOpen(true); // Show success snackbar
                // Reset form after successful submission
                setFormData({ customer_name: '', customer_email: '', subject: '', body: '', priority: 'Medium' });
                // Optional: Redirect after a delay
                // setTimeout(() => navigate(`/tickets`), 3000);
            } else {
                 // Should be handled by interceptor, but have a fallback
                 setError('Failed to create ticket. Unexpected response.');
            }

        } catch (err) {
             console.error("Error creating ticket:", err);
             setError(err?.message || 'Failed to create ticket. Check backend connection and logs.');
             setSuccessInfo(null); // Clear success on error
        } finally {
             setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Create New Support Ticket
            </Typography>

            <Paper sx={{ p: { xs: 2, sm: 3 } }} component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={3}>
                    {/* Error Alert */}
                    {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}

                    {/* Success Info Box */}
                     {successInfo && !loading && (
                        <Grid item xs={12}>
                            <Alert severity="success" onClose={() => setSuccessInfo(null)}>
                                 Ticket #{successInfo.id} created successfully! <br/>
                                 <strong>AI Summary:</strong> {successInfo.summary} <br/>
                                 <strong>AI Actions:</strong> {successInfo.actions.join('; ')}
                            </Alert>
                        </Grid>
                     )}

                    {/* Form Fields */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            fullWidth
                            id="customer_name"
                            label="Customer Name"
                            name="customer_name"
                            value={formData.customer_name}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            id="customer_email"
                            label="Customer Email (Optional)"
                            name="customer_email"
                            type="email"
                            value={formData.customer_email}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            required
                            fullWidth
                            id="subject"
                            label="Subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Grid>
                     <Grid item xs={12} sm={4}>
                         <FormControl fullWidth size="small"> {/* Match TextField size */}
                            <InputLabel id="priority-select-label">Priority</InputLabel>
                            <Select
                                labelId="priority-select-label"
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                label="Priority"
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <MenuItem value={'Low'}>Low</MenuItem>
                                <MenuItem value={'Medium'}>Medium</MenuItem>
                                <MenuItem value={'High'}>High</MenuItem>
                                <MenuItem value={'Urgent'}>Urgent</MenuItem>
                            </Select>
                        </FormControl>
                     </Grid>
                     <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            id="body"
                            label="Issue Description"
                            name="body"
                            multiline
                            rows={6} // Adjust rows as needed
                            value={formData.body}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ textAlign: 'right' }}> {/* Align button right */}
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ minWidth: 150 }} // Give button some min width
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Ticket'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

             {/* Optional Snackbar for brief success message */}
             <Snackbar
                 open={snackbarOpen}
                 autoHideDuration={5000} // Hide after 5 seconds
                 onClose={handleSnackbarClose}
                 message={`Ticket #${successInfo?.id} created! Summary generated.`}
                 anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
             />
        </Box>
    );
}

export default CreateTicketPage;