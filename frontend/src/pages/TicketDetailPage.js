// frontend/src/pages/TicketDetailPage.jsx (or .js)
import React, { useState, useEffect, useCallback } from 'react'; // <<<--- ADDED useCallback HERE
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
// MUI Imports
import {
    Box, Typography, CircularProgress, Paper, Grid, Link, Chip, Alert,
    Divider, Stack, Button, IconButton, Tooltip, TextField
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// API Imports
import { getTicketById, getRecommendations, postRecommendationFeedback, updateTicketStatus, assignTicket } from '../services/api.js';
// Icon Imports
import InfoIcon from '@mui/icons-material/Info';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SummarizeIcon from '@mui/icons-material/Summarize';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import RecommendIcon from '@mui/icons-material/Recommend';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GroupIcon from '@mui/icons-material/Group';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';


// --- Helper Functions ---
const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { console.error("Error formatting date:", dateString, e); return 'Invalid Date'; } };
const getStatusIcon = (lowerStatus) => { switch (lowerStatus) { case 'open': return <PendingIcon fontSize="small" />; case 'in progress': return <PendingIcon fontSize="small" />; case 'resolved': return <CheckCircleIcon fontSize="small" />; case 'closed': return <CheckCircleIcon fontSize="small" />; case 'escalated': return <ErrorIcon fontSize="small" />; default: return null; } };
const getStatusProps = (status) => { const ls = status?.toLowerCase()||''; let colorName = 'default'; switch(ls){ case 'open': colorName = 'status_open'; break; case 'in progress': colorName = 'status_inprogress'; break; case 'resolved': colorName = 'status_resolved'; break; case 'closed': colorName = 'status_closed'; break; case 'escalated': colorName = 'status_escalated'; break; default: colorName = 'default'; } return {c: colorName, t: status||'N/A', i: getStatusIcon(ls) }; };
const getPriorityProps = (priority) => { const lp = priority?.toLowerCase()||''; switch(lp){ case 'low': return {i:<KeyboardArrowDownIcon sx={{color:'success.main'}}/>,t:'Low'}; case 'high': return {i:<KeyboardArrowUpIcon sx={{color:'error.main'}}/>,t:'High'}; case 'urgent': return {i:<PriorityHighIcon sx={{color:'error.dark'}}/>,t:'Urgent'}; default: return {i:<RemoveIcon sx={{color:'warning.main'}}/>,t:'Medium'};}};
const SectionTitle = ({ icon, children }) => ( <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', fontWeight: 600 }}> {icon && React.cloneElement(icon, { sx: { mr: 0.75, fontSize: '1.1rem' } })} {children} </Typography> );
// --- End Helper Functions ---


function TicketDetailPage() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsError, setRecsError] = useState(null);
    const [feedbackStatus, setFeedbackStatus] = useState({});
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    // Fetch ticket and recommendations data (wrapped in useCallback)
    const loadTicketData = useCallback(async () => {
        if (!ticketId) { setError("No ticket ID provided."); setLoading(false); return; }
        console.log(`Loading data for ticket ID: ${ticketId}`);
        setLoading(true); setRecsLoading(true); setError(null); setActionError(''); setRecommendations([]); setFeedbackStatus({});

        try {
            const [ticketResponse, recsResponse] = await Promise.allSettled([ getTicketById(ticketId), getRecommendations(ticketId) ]);

            if (ticketResponse.status === 'fulfilled') { setTicket(ticketResponse.value.data); }
            else { console.error(`Failed fetch ticket ${ticketId}:`, ticketResponse.reason); throw new Error(ticketResponse.reason?.message || `Could not load ticket ${ticketId}.`); }

            if (recsResponse.status === 'fulfilled') { setRecommendations(recsResponse.value.data?.recommendations || []); }
            else { console.error(`Failed recs fetch:`, recsResponse.reason); setRecsError(recsResponse.reason?.message || "Could not load recommendations."); setRecommendations([]); }

        } catch (err) { console.error("Error loading ticket detail page:", err); setError(err.message); setTicket(null); setRecommendations([]); }
        finally { setLoading(false); setRecsLoading(false); }
    }, [ticketId]); // Dependency on ticketId

    useEffect(() => { loadTicketData(); }, [loadTicketData]); // Load data on mount/ID change

     // --- Feedback and Action Handlers ---
     const handleFeedback = async (recommendationId, wasHelpful) => { /* ... same as before ... */ console.log(`Feedback for Rec ID ${recommendationId}: Helpful = ${wasHelpful}`); setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'submitting' })); try { const feedbackData = { recommendation_id: recommendationId, was_helpful: wasHelpful, ticket_id: ticket.id }; await postRecommendationFeedback(feedbackData); setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'submitted' })); } catch (error) { console.error(`Failed feedback submit:`, error); setFeedbackStatus(prev => ({ ...prev, [recommendationId]: 'error' })); } };
     const handleDialogAction = async (action) => { /* ... same as before ... */
         if (!ticket || !ticket.id) return; setActionError(''); setIsActionLoading(true); console.log(`Action "${action}" for ticket ${ticket.id}`);
         try { let success = false; let successMessage = '';
             if (action === 'close') { await updateTicketStatus(ticket.id, 'Closed'); success = true; successMessage = `Ticket #${ticket.id} closed.`; }
             else if (action === 'escalate') { const escalationTeam = "Escalation Team"; const escalationStatus = "Escalated"; await updateTicketStatus(ticket.id, escalationStatus); await assignTicket(ticket.id, { team: escalationTeam, agent_id: null }); success = true; successMessage = `Ticket #${ticket.id} escalated.`; }
             else if (action === 'send_response') { alert('Send Response functionality not implemented.'); /* success = true; */ }
             else { throw new Error(`Unknown action: ${action}`); }
             if (success) { console.log(successMessage); await loadTicketData(); /* Reload data on success */ }
         } catch (error) { console.error(`Failed action '${action}':`, error); setActionError(error?.message || `Failed to ${action} ticket.`); }
         finally { setIsActionLoading(false); }
     };
     // --- End Handlers ---


    // --- Render Logic ---
    if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }
    if (error) { return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>; }
    if (!ticket) { return <Typography sx={{ p: 3 }}>Ticket not found.</Typography>; }

    // Determine display values after ticket is loaded
    const statusProps = getStatusProps(ticket.status);
    const priorityProps = getPriorityProps(ticket.priority);
    const assignedTo = ticket.assigned_agent_id ? `Agent ${ticket.assigned_agent_id}` : (ticket.assigned_team || 'Unassigned');
    const assignedIcon = ticket.assigned_agent_id ? <AccountCircleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} /> : (ticket.assigned_team ? <GroupIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }}/> : null);


    return (
        <Box>
             <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/app/tickets" sx={{ mb: 2 }}>
                Back to Tickets
             </Button>

            <Paper elevation={0} variant="outlined" sx={{ p: 0 }}>
                {/* Title Section */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                       <Chip label={`ID: ${ticket.id}`} size="small" variant='outlined'/>
                       <Typography variant="h5" component="div">{ticket.subject || '(No Subject)'}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button onClick={() => handleDialogAction('escalate')} color="warning" variant="outlined" size="small" disabled={ticket.status === 'Closed' || ticket.status === 'Escalated' || isActionLoading} startIcon={isActionLoading ? <CircularProgress size={14}/> : <WarningAmberIcon fontSize='small'/>}>Escalate</Button>
                        <Button onClick={() => handleDialogAction('close')} color="secondary" variant="outlined" size="small" disabled={ticket.status === 'Closed' || isActionLoading} startIcon={isActionLoading ? <CircularProgress size={14}/> : null}>Close Ticket</Button>
                    </Stack>
                </Box>

                 {/* Action Error Display */}
                 {actionError && <Alert severity="error" sx={{ m: 2, borderRadius: 1 }}>{actionError}</Alert>}

                 {/* Main content Grid */}
                 <Grid container spacing={0}>
                    {/* Left Panel */}
                    <Grid item xs={12} md={5} sx={{ p: { xs: 2, sm: 3 }, borderRight: { md: 1 }, borderColor: { md: 'divider'}, bgcolor: 'action.hover' }}>
                        <SectionTitle icon={<InfoIcon />}>Ticket Details</SectionTitle>
                        <Box sx={{mb: 2, pl: 1}}>
                           <Typography variant="body2" gutterBottom><strong>Customer:</strong> {ticket.customer_name} ({ticket.customer_email ? <Link href={`mailto:${ticket.customer_email}`} underline="hover">{ticket.customer_email}</Link> : 'N/A'})</Typography>
                           <Typography variant="body2" gutterBottom><strong>Status:</strong> <Chip label={statusProps.t} size="small" sx={{...statusProps.sx, textTransform:'capitalize', ml: 0.5}} icon={statusProps.i}/></Typography>
                           <Typography variant="body2" gutterBottom><strong>Priority:</strong> <Tooltip title={priorityProps.t}><Box sx={{ display: 'inline-flex', alignItems: 'center', color: priorityProps.color, verticalAlign: 'middle', ml: 0.5 }}>{priorityProps.i}</Box></Tooltip> {priorityProps.t}</Typography>
                           <Typography variant="body2" gutterBottom><strong>Assigned:</strong> <Box sx={{ display: 'inline-flex', alignItems: 'center', color: 'text.secondary' }}>{assignedIcon}{assignedTo}</Box></Typography>
                           <Typography variant="body2" gutterBottom><strong>Created:</strong> {formatDate(ticket.created_at)}</Typography>
                           <Typography variant="body2" gutterBottom><strong>Updated:</strong> {formatDate(ticket.updated_at)}</Typography>
                           {ticket.resolved_at && <Typography variant="body2" gutterBottom><strong>Resolved:</strong> {formatDate(ticket.resolved_at)}</Typography>}
                           <Typography variant="body2" gutterBottom><strong>Prediction:</strong> {ticket.predicted_resolution_time ? `${ticket.predicted_resolution_time} min` : 'N/A'}</Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                            <SectionTitle icon={<SummarizeIcon />}>AI Summary</SectionTitle>
                            <Typography paragraph variant="body2" sx={{ whiteSpace: 'pre-wrap', p: 1.5, borderRadius: 1 }}> {ticket.summary || <i>Not generated yet.</i>} </Typography>
                             <SectionTitle icon={<PlaylistPlayIcon />}>AI Extracted Actions</SectionTitle>
                             {ticket.extracted_actions && ticket.extracted_actions.length > 0 && ticket.extracted_actions[0] !== 'No specific actions identified' && ticket.extracted_actions[0] !== '[Action extraction failed]' ? ( <Box component="ul" sx={{ pl: 3, my: 0, py: 0 }}> {ticket.extracted_actions.map((action, index) => <Typography component="li" variant="body2" key={index} sx={{mb: 0.5}}>{action}</Typography>)} </Box> ) : ( <Typography variant="body2" sx={{ fontStyle: 'italic', my:1 }}>{ticket.extracted_actions?.[0] || 'None extracted.'}</Typography> )}
                        </Box>
                    </Grid>

                    {/* Right Panel */}
                    <Grid item xs={12} md={7} sx={{ p: { xs: 2, sm: 3 } }}>
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
                        {/* This TextField needs the import */}
                        <TextField multiline rows={5} fullWidth placeholder="Enter your response or internal notes..." variant="outlined" sx={{mb: 2}} />
                        <Button onClick={() => handleDialogAction('send_response')} variant="contained" size="small" disabled={ticket.status === 'Closed' || isActionLoading} sx={{display:'flex', ml: 'auto'}}> Send / Save Note </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

export default TicketDetailPage;