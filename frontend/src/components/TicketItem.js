// frontend/src/components/TicketItem.js
import React, { useState } from 'react';
// Import MUI components... Ensure Grid and Paper are included
import { TableRow, TableCell, Button, Chip, IconButton, Tooltip, Box, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Link, TextField, CircularProgress, Alert, Grid, Paper } from '@mui/material'; // <<<--- Added Grid & Paper
// Import MUI Icons...
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GroupIcon from '@mui/icons-material/Group';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';

// Import API functions
import { getRecommendations, postRecommendationFeedback } from '../services/api.js';

// Helper function to get status chip color and icon
const getStatusProps = (status) => {
    const lowerStatus = status?.toLowerCase() || 'unknown';
    switch (lowerStatus) {
        case 'open': return { color: 'info', icon: <PendingIcon fontSize="small" /> };
        case 'in progress': return { color: 'warning', icon: <PendingIcon fontSize="small" /> };
        case 'resolved': return { color: 'success', icon: <CheckCircleIcon fontSize="small" /> };
        case 'closed': return { color: 'default', icon: <CheckCircleIcon fontSize="small" /> };
        case 'escalated': return { color: 'error', icon: <ErrorIcon fontSize="small" /> };
        default: return { color: 'default', icon: null };
    }
};

// Helper function to get priority icon and color
const getPriorityProps = (priority) => {
    const lowerPriority = priority?.toLowerCase() || 'medium';
    switch (lowerPriority) {
        case 'low': return { icon: <KeyboardArrowDownIcon />, color: 'success.main', title: 'Low' };
        case 'medium': return { icon: <RemoveIcon />, color: 'warning.main', title: 'Medium' };
        case 'high': return { icon: <KeyboardArrowUpIcon />, color: 'error.main', title: 'High' };
        case 'urgent': return { icon: <PriorityHighIcon />, color: 'error.dark', title: 'Urgent' };
        default: return { icon: <RemoveIcon />, color: 'action.active', title: 'Medium' };
    }
};

// Helper function to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};


function TicketItem({ ticket, reloadTickets }) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsError, setRecsError] = useState(null);
    const [feedbackStatus, setFeedbackStatus] = useState({}); // e.g., { 123: 'submitting', 456: 'submitted' }

    // Fetch Recommendations when Dialog Opens
    const handleOpenDetails = async () => {
        setDetailsOpen(true);
        setRecsLoading(true);
        setRecsError(null);
        setRecommendations([]);
        setFeedbackStatus({});

        if (!ticket || typeof ticket.id === 'undefined') {
             console.error("Ticket data or ticket ID is missing in handleOpenDetails.");
             setRecsError("Invalid ticket data.");
             setRecsLoading(false);
             return;
        }

        try {
           // Log the ID being fetched
           console.log(`FETCHING recommendations for ticket ID: ${ticket?.id}, Type: ${typeof ticket?.id}`);
           const response = await getRecommendations(ticket.id);
           const recsData = response.data?.recommendations || [];
           setRecommendations(recsData);
           if (recsData.length === 0) {
               console.log(`No recommendations returned for ticket ${ticket.id}`);
           }
        } catch (error) {
           console.error(`Failed to fetch recommendations for ticket ${ticket.id}:`, error);
           setRecsError(error?.message || "Could not load recommendations.");
           setRecommendations([]);
        } finally {
           setRecsLoading(false);
        }
    };

    const handleCloseDetails = () => {
        setDetailsOpen(false);
    };

    // Handle Recommendation Feedback
    const handleFeedback = async (recommendationId, wasHelpful) => {
         console.log(`Feedback for Rec ID ${recommendationId}: Helpful = ${wasHelpful}`);
         setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'submitting' }));

         try {
             const feedbackData = {
                 recommendation_id: recommendationId,
                 was_helpful: wasHelpful,
                 ticket_id: ticket.id
             };
             await postRecommendationFeedback(feedbackData);
             setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'submitted' }));
         } catch (error) {
              console.error(`Failed to submit feedback for Rec ID ${recommendationId}:`, error);
              setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'error' }));
         }
    };

    // Placeholder handlers for other dialog actions
    const handleDialogAction = async (action) => {
        console.log(`Performing action "${action}" for ticket ${ticket.id}`);
        // Add actual logic later using API calls
        alert(`${action} functionality not implemented yet.`);
    };

    // Determine display values safely
    const statusProps = getStatusProps(ticket?.status);
    const priorityProps = getPriorityProps(ticket?.priority);
    const assignedTo = ticket?.assigned_agent_id
                       ? `Agent ${ticket.assigned_agent_id}` // TODO: Fetch agent name
                       : (ticket?.assigned_team || 'Unassigned');
    const assignedIcon = ticket?.assigned_agent_id ? <AccountCircleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} /> : (ticket?.assigned_team ? <GroupIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }}/> : null);

    // Prevent rendering if ticket data is missing
    if (!ticket) {
        return null;
    }

    return (
        <>
            {/* Table Row */}
            <TableRow hover sx={{ '& > *': { py: 1 } }}>
                <TableCell sx={{ fontWeight: 'medium' }}>{ticket.id}</TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={ticket.subject || ''}>
                         <Box component="span" sx={{ cursor: 'pointer' }} onClick={handleOpenDetails}>
                             {ticket.subject || '(No Subject)'}
                         </Box>
                    </Tooltip>
                    </TableCell>
                <TableCell>{ticket.customer_name || 'N/A'}</TableCell>
                <TableCell>
                    <Chip
                        label={ticket.status || 'Unknown'}
                        color={statusProps.color}
                        size="small"
                        icon={statusProps.icon}
                        sx={{ textTransform: 'capitalize' }}
                        />
                </TableCell>
                 <TableCell>
                     <Tooltip title={priorityProps.title}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', color: priorityProps.color }}>
                            {priorityProps.icon}
                        </Box>
                    </Tooltip>
                 </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                        {assignedIcon}
                        {assignedTo}
                    </Box>
                </TableCell>
                <TableCell sx={{whiteSpace: 'nowrap'}}>{formatDate(ticket.created_at)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title="View Details / Respond">
                        <IconButton size="small" onClick={handleOpenDetails}>
                            <VisibilityIcon fontSize='small'/>
                        </IconButton>
                    </Tooltip>
                </TableCell>
            </TableRow>

            {/* Ticket Detail Dialog Modal */}
            <Dialog open={detailsOpen} onClose={handleCloseDetails} fullWidth maxWidth="md" scroll="paper">
                {/* Render Dialog only if ticket exists */}
                {ticket && (
                    <>
                        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Ticket #{ticket.id} - {ticket.subject || '(No Subject)'}
                            <IconButton aria-label="close" onClick={handleCloseDetails} sx={{ color: (theme) => theme.palette.grey[500] }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers sx={{ p: 3 }}>
                            {/* Ticket Info Grid */}
                            <Grid container spacing={2}> {/* <<< Grid requires import */}
                                <Grid item xs={12} md={6}>
                                    <Typography gutterBottom><strong>Customer:</strong> {ticket.customer_name} ({ticket.customer_email ? <Link href={`mailto:${ticket.customer_email}`}>{ticket.customer_email}</Link> : 'No email'})</Typography>
                                    <Typography gutterBottom><strong>Status:</strong> {ticket.status}</Typography>
                                    <Typography gutterBottom><strong>Priority:</strong> {ticket.priority}</Typography>
                                    <Typography gutterBottom><strong>Assigned:</strong> {assignedTo}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography gutterBottom><strong>Created:</strong> {formatDate(ticket.created_at)}</Typography>
                                    <Typography gutterBottom><strong>Last Updated:</strong> {formatDate(ticket.updated_at)}</Typography>
                                    {ticket.resolved_at && <Typography gutterBottom><strong>Resolved:</strong> {formatDate(ticket.resolved_at)}</Typography>}
                                    <Typography gutterBottom><strong>Predicted Resolution:</strong> {ticket.predicted_resolution_time ? `${ticket.predicted_resolution_time} minutes` : 'Not predicted'}</Typography>
                                </Grid>
                            </Grid>

                            {/* Summary */}
                            <Typography variant="h6" sx={{ mt: 3 }}>Summary:</Typography>
                            <Typography paragraph variant="body2" sx={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', p:1.5, borderRadius: 1, border: '1px solid #eee' }}>
                               {ticket.summary || <i>No summary generated yet.</i>}
                            </Typography>

                            {/* Extracted Actions */}
                            <Typography variant="h6" sx={{ mt: 2 }}>Extracted Actions:</Typography>
                             {ticket.extracted_actions && ticket.extracted_actions.length > 0 && ticket.extracted_actions[0] !== 'No specific actions identified' && ticket.extracted_actions[0] !== '[Action extraction failed]' ? (
                                 <Box component="ul" sx={{ pl: 2.5, my: 1 }}>
                                    {ticket.extracted_actions.map((action, index) => <Typography component="li" variant="body2" key={index}>{action}</Typography>)}
                                 </Box>
                             ) : (
                                 <Typography variant="body2" sx={{ fontStyle: 'italic', my:1 }}>{ticket.extracted_actions?.[0] || 'No actions extracted yet.'}</Typography>
                             )}

                            {/* Full Description */}
                            <Typography variant="h6" sx={{ mt: 2 }}>Full Description:</Typography>
                            <Typography paragraph variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{ticket.body}</Typography>

                             {/* Resolution Details */}
                             {ticket.resolution_details && (
                                <>
                                    <Typography variant="h6" sx={{ mt: 2 }}>Resolution Details:</Typography>
                                    <Typography paragraph variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{ticket.resolution_details}</Typography>
                                </>
                             )}

                            {/* Resolution Recommendations Section */}
                            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Resolution Recommendations:</Typography>
                            {recsLoading && <Box sx={{display: 'flex', alignItems: 'center', my: 2}}><CircularProgress size={20} sx={{mr: 1}} /> <Typography variant="body2">Loading recommendations...</Typography></Box>}
                            {recsError && <Alert severity="error" sx={{my: 1}}>Error: {recsError}</Alert>}
                            {!recsLoading && !recsError && recommendations.length > 0 && (
                               <Box sx={{ my: 1 }}>
                                 {recommendations.map((rec) => (
                                    // This Paper component needs the import vvvvv
                                    <Paper key={rec.id} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{rec.title}</Typography>
                                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                         (Similarity: {rec.similarity?.toFixed(4)}, Score: {rec.score?.toFixed(4)}) {/* Added optional chaining & formatting */}
                                      </Typography>
                                       <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'auto', mb: 1 }}>
                                            {rec.content}
                                        </Typography>
                                       {/* Feedback Buttons */}
                                       <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                                            <Typography variant="caption">Helpful?</Typography>
                                            <Tooltip title="Helpful">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleFeedback(rec.id, true)}
                                                        disabled={feedbackStatus[rec.id] === 'submitting' || feedbackStatus[rec.id] === 'submitted'}
                                                        color={feedbackStatus[rec.id] === 'submitted' ? 'success' : 'default'}
                                                    >
                                                        <ThumbUpOffAltIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="Not Helpful">
                                                 <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleFeedback(rec.id, false)}
                                                        disabled={feedbackStatus[rec.id] === 'submitting' || feedbackStatus[rec.id] === 'submitted'}
                                                    >
                                                        <ThumbDownOffAltIcon fontSize="small" />
                                                    </IconButton>
                                                 </span>
                                            </Tooltip>
                                            {feedbackStatus[rec.id] === 'submitting' && <CircularProgress size={16} />}
                                            {feedbackStatus[rec.id] === 'submitted' && <Typography variant="caption" color="success.main">Thanks!</Typography>}
                                            {feedbackStatus[rec.id] === 'error' && <Typography variant="caption" color="error">Error</Typography>}
                                       </Box>
                                    </Paper> // <--- Closing Paper
                                  ))}
                               </Box>
                            )}
                             {!recsLoading && !recsError && recommendations.length === 0 && (
                                  <Typography variant="body2" sx={{ fontStyle: 'italic', my:1 }}>No relevant recommendations found.</Typography>
                             )}

                            {/* Response Area */}
                             <Typography variant="h6" sx={{ mt: 3 }}>Respond / Add Notes:</Typography>
                             <TextField
                                multiline
                                rows={4}
                                fullWidth
                                label="Enter your response or internal notes..."
                                variant="outlined"
                                sx={{mt: 1, mb: 2}}
                             />

                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                             <Button onClick={() => handleDialogAction('escalate')} color="warning" variant="outlined" disabled={ticket?.status === 'Closed'}>
                                Escalate
                            </Button>
                             <Button onClick={() => handleDialogAction('close')} color="secondary" variant="outlined" disabled={ticket?.status === 'Closed'}>
                                Close Ticket
                            </Button>
                             <Button onClick={handleCloseDetails} variant="text">
                                Cancel
                            </Button>
                             <Button onClick={() => handleDialogAction('send_response')} variant="contained" disabled={ticket?.status === 'Closed'}>
                                Send Response / Save Note
                            </Button>
                        </DialogActions>
                    </>
                )} {/* End check for ticket existence */}
            </Dialog>
        </>
    );
}

export default TicketItem;