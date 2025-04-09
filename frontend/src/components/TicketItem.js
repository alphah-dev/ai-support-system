// frontend/src/components/TicketItem.js (or .jsx)
import React, { useState } from 'react';
// MUI Imports
import {
    TableRow, TableCell, Button, Chip, IconButton, Tooltip, Box, Dialog, DialogTitle,
    DialogContent, DialogActions, Typography, Link, TextField, CircularProgress,
    Alert, Grid, Paper, Divider, Stack, ListItemIcon
} from '@mui/material';
// MUI Icon Imports
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
import NotesIcon from '@mui/icons-material/Notes';
import SummarizeIcon from '@mui/icons-material/Summarize';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import RecommendIcon from '@mui/icons-material/Recommend';
import InfoIcon from '@mui/icons-material/Info';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // Icon for Escalate button

// API Imports - Ensure assignTicket is imported
import { getRecommendations, postRecommendationFeedback, updateTicketStatus, assignTicket } from '../services/api.js';

// --- Helper Functions (Keep existing: getStatusProps, getStatusIcon, getPriorityProps, formatDate, SectionTitle) ---
const getStatusProps = (status) => { /* ... */ const lowerStatus = status?.toLowerCase() || 'unknown'; let colorName = 'default'; let customSx = {}; switch (lowerStatus) { case 'open': colorName = 'status_open'; break; case 'in progress': colorName = 'status_inprogress'; break; case 'resolved': colorName = 'status_resolved'; break; case 'closed': colorName = 'status_closed'; break; case 'escalated': colorName = 'status_escalated'; break; default: colorName = 'default'; } return { icon: getStatusIcon(lowerStatus), sx: colorName !== 'default' ? { bgcolor: `${colorName}.main`, color: `${colorName}.contrastText`, ...customSx } : {} }; };
const getStatusIcon = (lowerStatus) => { /* ... */ switch (lowerStatus) { case 'open': return <PendingIcon fontSize="small" />; case 'in progress': return <PendingIcon fontSize="small" />; case 'resolved': return <CheckCircleIcon fontSize="small" />; case 'closed': return <CheckCircleIcon fontSize="small" />; case 'escalated': return <ErrorIcon fontSize="small" />; default: return null; } };
const getPriorityProps = (priority) => { /* ... */ const lowerPriority = priority?.toLowerCase() || 'medium'; switch (lowerPriority) { case 'low': return { icon: <KeyboardArrowDownIcon />, color: 'success.main', title: 'Low' }; case 'medium': return { icon: <RemoveIcon />, color: 'warning.main', title: 'Medium' }; case 'high': return { icon: <KeyboardArrowUpIcon />, color: 'error.main', title: 'High' }; case 'urgent': return { icon: <PriorityHighIcon />, color: 'error.dark', title: 'Urgent' }; default: return { icon: <RemoveIcon />, color: 'action.active', title: 'Medium' }; } };
const formatDate = (dateString) => { /* ... */ if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { console.error("Error formatting date:", dateString, e); return 'Invalid Date'; } };
const SectionTitle = ({ icon, children }) => ( <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', fontWeight: 600 }}> {icon && React.cloneElement(icon, { sx: { mr: 0.75, fontSize: '1.1rem' } })} {children} </Typography> );
// --- End Helper Functions ---

function TicketItem({ ticket, reloadTickets }) {
    // --- State (Keep existing + isActionLoading, actionError) ---
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsError, setRecsError] = useState(null);
    const [feedbackStatus, setFeedbackStatus] = useState({});
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    // --- End State ---

    // --- Handlers (Keep existing: handleOpenDetails, handleCloseDetails, handleFeedback) ---
    const handleOpenDetails = async () => { /* ... from Response 32/34 ... */ setActionError(''); setDetailsOpen(true); setRecsLoading(true); setRecsError(null); setRecommendations([]); setFeedbackStatus({}); if (!ticket || typeof ticket.id === 'undefined') { setRecsError("Invalid ticket data."); setRecsLoading(false); return; } try { console.log(`FETCHING recommendations for ticket ID: ${ticket?.id}`); const response = await getRecommendations(ticket.id); const recsData = response.data?.recommendations || []; setRecommendations(recsData); if (recsData.length === 0) console.log(`No recommendations returned for ticket ${ticket.id}`); } catch (error) { console.error(`Failed to fetch recommendations for ticket ${ticket.id}:`, error); setRecsError(error?.message || "Could not load recommendations."); setRecommendations([]); } finally { setRecsLoading(false); } };
    const handleCloseDetails = () => { setDetailsOpen(false); };
    const handleFeedback = async (recommendationId, wasHelpful) => { /* ... from Response 32/34 ... */ console.log(`Feedback for Rec ID ${recommendationId}: Helpful = ${wasHelpful}`); setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'submitting' })); try { const feedbackData = { recommendation_id: recommendationId, was_helpful: wasHelpful, ticket_id: ticket.id }; await postRecommendationFeedback(feedbackData); setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'submitted' })); } catch (error) { console.error(`Failed to submit feedback for Rec ID ${recommendationId}:`, error); setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'error' })); } };
    // --- End Handlers ---

    // --- UPDATED Generic Handler for Dialog Actions ---
    const handleDialogAction = async (action) => {
        if (!ticket || !ticket.id) return;

        setActionError('');
        setIsActionLoading(true);
        console.log(`Performing action "${action}" for ticket ${ticket.id}`);

        try {
            let success = false;
            let successMessage = ''; // Optional message for snackbar

            if (action === 'close') {
                await updateTicketStatus(ticket.id, 'Closed');
                success = true;
                successMessage = `Ticket #${ticket.id} closed.`;
            } else if (action === 'escalate') {
                // Define escalation target
                const escalationTeam = "Escalation Team"; // Or "Tier 2", etc.
                const escalationStatus = "Escalated";

                console.log(`Escalating ticket ${ticket.id} to ${escalationTeam} with status ${escalationStatus}`);
                // Perform actions sequentially or in parallel if desired
                await updateTicketStatus(ticket.id, escalationStatus); // Set status first
                await assignTicket(ticket.id, { team: escalationTeam, agent_id: null }); // Assign to team, unassign specific agent
                success = true;
                successMessage = `Ticket #${ticket.id} escalated to ${escalationTeam}.`;

            } else if (action === 'send_response') {
                 // TODO: Get response text from state/input and call appropriate API
                 alert('Send Response functionality not implemented yet.');
                 // success = true; // Set true if API call succeeds
            } else {
                 console.warn(`Unknown dialog action: ${action}`);
                 throw new Error(`Unknown action requested: ${action}`); // Throw error for unknown actions
            }

            if (success) {
                console.log(successMessage);
                handleCloseDetails(); // Close dialog on success
                if (reloadTickets) {
                     reloadTickets(); // Refresh the ticket list
                }
                // TODO: Show success snackbar here with successMessage?
            }

        } catch (error) {
            console.error(`Failed to perform action '${action}' for ticket ${ticket.id}:`, error);
            // Set error state to display in the dialog
            setActionError(error?.message || `Failed to ${action} ticket ${ticket.id}.`);
            // Do NOT close dialog on error
        } finally {
            setIsActionLoading(false); // Reset loading state regardless of success/failure
        }
    };
    // --- End UPDATED Handler ---


    // --- Determine display values (Keep existing) ---
    const statusProps = getStatusProps(ticket?.status);
    const priorityProps = getPriorityProps(ticket?.priority);
    const assignedTo = ticket?.assigned_agent_id ? `Agent ${ticket.assigned_agent_id}` : (ticket?.assigned_team || 'Unassigned');
    const assignedIcon = ticket?.assigned_agent_id ? <AccountCircleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} /> : (ticket?.assigned_team ? <GroupIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }}/> : null);

    if (!ticket) { return null; }

    return (
        <>
            {/* Table Row (Keep existing) */}
            <TableRow hover sx={{ '& > *': { py: 1.25 } }}>
                <TableCell sx={{ fontWeight: 'medium' }}>{ticket.id}</TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Tooltip title={ticket.subject || ''}><Box component="span" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }} onClick={handleOpenDetails}>{ticket.subject || '(No Subject)'}</Box></Tooltip></TableCell>
                <TableCell>{ticket.customer_name || 'N/A'}</TableCell>
                <TableCell><Chip label={ticket.status || 'Unknown'} size="small" icon={statusProps.icon} sx={{ ...statusProps.sx, textTransform: 'capitalize', fontWeight: 500 }} /></TableCell>
                <TableCell><Tooltip title={priorityProps.title}><Box sx={{ display: 'inline-flex', alignItems: 'center', color: priorityProps.color }}>{priorityProps.icon}</Box></Tooltip></TableCell>
                <TableCell><Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', color: 'text.secondary' }}>{assignedIcon}{assignedTo}</Box></TableCell>
                <TableCell sx={{whiteSpace: 'nowrap', color: 'text.secondary'}}>{formatDate(ticket.created_at)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}><Tooltip title="View Details / Respond"><IconButton size="small" onClick={handleOpenDetails} color="primary"><VisibilityIcon fontSize='small'/></IconButton></Tooltip></TableCell>
            </TableRow>

            {/* Ticket Detail Dialog */}
            <Dialog open={detailsOpen} onClose={handleCloseDetails} fullWidth maxWidth="lg" scroll="paper">
                {ticket && ( <>
                        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                            <Stack direction="row" spacing={1} alignItems="center"> <Chip label={`ID: ${ticket.id}`} size="small" variant='outlined'/> <Typography variant="h6" component="div">{ticket.subject || '(No Subject)'}</Typography> </Stack>
                            <IconButton aria-label="close" onClick={handleCloseDetails} sx={{ color: (theme) => theme.palette.grey[500] }}><CloseIcon /></IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ p: 0 }}>
                             {/* Display Action Error */}
                             {actionError && <Alert severity="error" sx={{ m: 2, mb: 0, borderRadius: 1 }}>{actionError}</Alert>}
                             {/* Main Grid Layout */}
                             <Grid container spacing={0}>
                                {/* Left Panel */}
                                <Grid item xs={12} md={5} sx={{ p: { xs: 2, sm: 3 }, borderRight: { md: 1 }, borderColor: { md: 'divider'}, bgcolor: 'action.hover' }}>
                                     <SectionTitle icon={<InfoIcon />}>Ticket Details</SectionTitle>
                                     <Box sx={{mb: 2, pl: 1}}> {/* ... Ticket detail Typography ... */} <Typography variant="body2" gutterBottom><strong>Customer:</strong> {ticket.customer_name} ({ticket.customer_email ? <Link href={`mailto:${ticket.customer_email}`} underline="hover">{ticket.customer_email}</Link> : 'N/A'})</Typography> <Typography variant="body2" gutterBottom><strong>Status:</strong> {ticket.status}</Typography> <Typography variant="body2" gutterBottom><strong>Priority:</strong> {ticket.priority}</Typography> <Typography variant="body2" gutterBottom><strong>Assigned:</strong> {assignedTo}</Typography> <Typography variant="body2" gutterBottom><strong>Created:</strong> {formatDate(ticket.created_at)}</Typography> <Typography variant="body2" gutterBottom><strong>Updated:</strong> {formatDate(ticket.updated_at)}</Typography> {ticket.resolved_at && <Typography variant="body2" gutterBottom><strong>Resolved:</strong> {formatDate(ticket.resolved_at)}</Typography>} <Typography variant="body2" gutterBottom><strong>Prediction:</strong> {ticket.predicted_resolution_time ? `${ticket.predicted_resolution_time} min` : 'N/A'}</Typography> </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box>
                                        <SectionTitle icon={<SummarizeIcon />}>AI Summary</SectionTitle>
                                        <Typography paragraph variant="body2" sx={{ whiteSpace: 'pre-wrap', p: 1.5, borderRadius: 1 }}> {ticket.summary || <i>Not generated yet.</i>} </Typography>
                                         <SectionTitle icon={<PlaylistPlayIcon />}>AI Extracted Actions</SectionTitle>
                                         {ticket.extracted_actions && ticket.extracted_actions.length > 0 && ticket.extracted_actions[0] !== 'No specific actions identified' && ticket.extracted_actions[0] !== '[Action extraction failed]' ? ( <Box component="ul" sx={{ pl: 3, my: 0, py: 0 }}> {ticket.extracted_actions.map((action, index) => <Typography component="li" variant="body2" key={index} sx={{mb: 0.5}}>{action}</Typography>)} </Box> ) : ( <Typography variant="body2" sx={{ fontStyle: 'italic', my:1 }}>{ticket.extracted_actions?.[0] || 'None extracted.'}</Typography> )}
                                    </Box>
                                </Grid>
                                {/* Right Panel */}
                                <Grid item xs={12} md={7} sx={{ p: { xs: 2, sm: 3 }, maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                                    <SectionTitle icon={<QuestionAnswerIcon />}>Full Description</SectionTitle>
                                    <Typography paragraph variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{ticket.body}</Typography>
                                     {ticket.resolution_details && ( <> <Divider sx={{ my: 2 }} /> <SectionTitle icon={<AssignmentIcon />}>Resolution Details</SectionTitle> <Typography paragraph variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{ticket.resolution_details}</Typography> </> )}
                                    <Divider sx={{ my: 2 }} />
                                    <SectionTitle icon={<RecommendIcon />}>AI Recommendations</SectionTitle>
                                    {recsLoading && <Box sx={{display: 'flex', alignItems: 'center', my: 2}}><CircularProgress size={20} sx={{mr: 1}} /> <Typography variant="body2">Loading recommendations...</Typography></Box>}
                                    {recsError && <Alert severity="error" sx={{my: 1}}>Error loading recommendations: {recsError}</Alert>}
                                    {!recsLoading && !recsError && recommendations.length > 0 && ( <Box sx={{ my: 1, maxHeight: 250, overflowY: 'auto', pr: 1 }}> {recommendations.map((rec) => ( <Paper key={rec.id} variant="outlined" sx={{ p: 1.5, mb: 1.5, '&:last-child': { mb: 0 } }}> <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{rec.title}</Typography> <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}> (Similarity: {rec.similarity?.toFixed(3)}, Score: {rec.score?.toFixed(3)}) </Typography> <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'auto', mb: 1, borderLeft: 3, borderColor: 'divider', pl: 1 }}> {rec.content} </Typography> <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}> <Typography variant="caption">Helpful?</Typography> <Tooltip title="Helpful"><span><IconButton size="small" onClick={() => handleFeedback(rec.id, true)} disabled={feedbackStatus[rec.id] === 'submitting' || feedbackStatus[rec.id] === 'submitted'} color={feedbackStatus[rec.id] === 'submitted' ? 'success' : 'default'}><ThumbUpOffAltIcon sx={{ fontSize: '1.1rem'}} /></IconButton></span></Tooltip> <Tooltip title="Not Helpful"><span><IconButton size="small" onClick={() => handleFeedback(rec.id, false)} disabled={feedbackStatus[rec.id] === 'submitting' || feedbackStatus[rec.id] === 'submitted'}><ThumbDownOffAltIcon sx={{ fontSize: '1.1rem'}} /></IconButton></span></Tooltip> {feedbackStatus[rec.id] === 'submitting' && <CircularProgress size={14} sx={{ ml: 0.5 }} />} {feedbackStatus[rec.id] === 'submitted' && <Typography variant="caption" color="success.main">Thanks!</Typography>} {feedbackStatus[rec.id] === 'error' && <Typography variant="caption" color="error">Error</Typography>} </Box> </Paper> ))} </Box> )}
                                     {!recsLoading && !recsError && recommendations.length === 0 && ( <Typography variant="body2" sx={{ fontStyle: 'italic', my:1 }}>No relevant recommendations found.</Typography> )}
                                    <Divider sx={{ my: 2 }} />
                                    <SectionTitle icon={<EditIcon />}>Respond / Add Notes</SectionTitle>
                                    <TextField multiline rows={5} fullWidth placeholder="Enter your response or internal notes..." variant="outlined" sx={{mb: 2}} />
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                            {/* --- Updated Escalate Button --- */}
                             <Button
                                onClick={() => handleDialogAction('escalate')}
                                color="warning"
                                variant="outlined"
                                size="small"
                                // Disable if already closed/escalated or action running
                                disabled={ticket?.status === 'Closed' || ticket?.status === 'Escalated' || isActionLoading}
                                startIcon={isActionLoading ? <CircularProgress size={14} color="inherit"/> : <WarningAmberIcon fontSize='small' />} // Show spinner or icon
                            >
                                Escalate
                            </Button>
                            {/* --- End Escalate Button --- */}

                             <Button onClick={() => handleDialogAction('close')} color="secondary" variant="outlined" size="small" disabled={ticket?.status === 'Closed' || isActionLoading} startIcon={isActionLoading ? <CircularProgress size={14} color="inherit"/> : null} > Close Ticket </Button>
                             <Box sx={{flexGrow: 1}} /> {/* Spacer */}
                             <Button onClick={handleCloseDetails} variant="text" size="small" disabled={isActionLoading}> Cancel </Button>
                             <Button onClick={() => handleDialogAction('send_response')} variant="contained" size="small" disabled={ticket?.status === 'Closed' || isActionLoading}> Send / Save </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
}

export default TicketItem;