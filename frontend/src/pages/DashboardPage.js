// frontend/src/pages/DashboardPage.jsx (or .js)
import React, { useState, useEffect, useCallback } from 'react';
import {
    Grid, Paper, Typography, Box, CircularProgress, Card, CardContent,
    Divider, Alert, Link as MuiLink, Stack, Button, Chip, Tooltip // Added Chip, Tooltip, Button
} from '@mui/material';
// Import Chart components
import ResolutionTimeChart from '../components/charts/ResolutionTimeChart.js';
import AgentPerformanceChart from '../components/charts/AgentPerformanceChart.js';
// Import Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SpeedIcon from '@mui/icons-material/Speed';
import RecommendIcon from '@mui/icons-material/Recommend';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AccessAlarmsIcon from '@mui/icons-material/AccessAlarms';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
// --- Added missing priority icons ---
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
// --- Added missing status icons (just in case) ---
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
// --- End Icon Imports ---
import { useAuth } from '../context/AuthContext.js';
import { Link as RouterLink } from 'react-router-dom';
import { getTickets } from '../services/api.js';


// --- Mock Data Function ---
const fetchDashboardMetrics = async () => { /* ... same mock data ... */ console.log("Fetching dashboard metrics (mock)..."); await new Promise(resolve => setTimeout(resolve, 500)); return { open_tickets: { value: 42, comparison: 12 }, resolved_last_24h: { value: 18, comparison: -8 }, avg_response_time_mins: { value: 14, comparison: 3, target: 15 }, sla_met_rate: { value: 92, comparison: -1 }, avg_resolution_time_hours: { value: 3.2, comparison: -5 }, customer_satisfaction: { value: 94, comparison: 2, nps: 76 }, escalations: { value: 7, comparison: 2, active: 3, resolved: 4 }, agent_performance: [ { agent_name: 'Alice', resolved_count: 165, avg_time_minutes: 170 }, { agent_name: 'Bob', resolved_count: 130, avg_time_minutes: 225 }, { agent_name: 'Charlie', resolved_count: 105, avg_time_minutes: 260 }, { agent_name: 'Diana', resolved_count: 190, avg_time_minutes: 145 }, { agent_name: 'Eve', resolved_count: 115, avg_time_minutes: 200 }, ], resolution_times_distribution: { '< 1h': 350, '1-4h': 580, '4-12h': 280, '12-24h': 110, '> 24h': 60, }, ai_summary_today: "Based on current patterns, expect to resolve **12 more tickets** today.", ai_resolution_estimates: [ { type: 'API Connection Issues', time: '~45 min' }, { type: 'Login/Authentication', time: '~30 min' }, { type: 'Billing Questions', time: '~15 min' } ], ai_suggested_articles: [ { id: 'KB-2345', title: 'Troubleshooting API Connection Issues' }, { id: 'KB-1038', title: 'Common Login Error Solutions' }, { id: 'KB-5621', title: 'Mobile App Authentication Guide' } ], ai_risk_alerts: { count: 5, message: 'tickets flagged as potential churn risks.'} }; };

// --- Reusable Metric Card Component ---
function MetricCard({ title, value, unit = '', comparison = null, comparisonLabel = "vs yesterday", icon = null }) { /* ... same as Response 48 ... */ const trendIcon = comparison === null ? null : (comparison > 0 ? <TrendingUpIcon sx={{ fontSize: '1rem', color: 'success.main', ml: 0.5 }}/> : (comparison < 0 ? <TrendingDownIcon sx={{ fontSize: '1rem', color: 'error.main', ml: 0.5 }}/> : <HorizontalRuleIcon sx={{ fontSize: '1rem', color: 'action.active', ml: 0.5 }}/>)); const comparisonText = comparison !== null ? `${comparison > 0 ? '+' : ''}${comparison}% ${comparisonLabel}` : ''; const comparisonColor = comparison === null ? 'text.secondary' : (comparison >= 0 ? 'success.main' : 'error.main'); return ( <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}> <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}> <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}> <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}> {title} </Typography> {icon && React.cloneElement(icon, { sx: { fontSize: '1.4rem', color: 'action.active' }})} </Box> <Box> <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2, mb: 0.5 }}> {value ?? 'N/A'} {value !== null && unit && <Typography variant="h6" component="span" sx={{ ml: 0.5, fontWeight: 500, color: 'text.secondary', fontSize: '1.1rem' }}>{unit}</Typography>} </Typography> {comparison !== null && ( <Box sx={{display: 'flex', alignItems: 'center', mt: 0.5}}> {trendIcon} <Typography variant="caption" sx={{ color: comparisonColor, fontWeight: 500 }}> {comparisonText} </Typography> </Box> )} </Box> </CardContent> </Card> ); }

// --- Helper functions needed by DashboardTicketRow ---
const getStatusProps = (status) => { const ls = status?.toLowerCase()||''; let colorName = 'default'; switch(ls){ case 'open': colorName = 'status_open'; break; case 'in progress': colorName = 'status_inprogress'; break; case 'resolved': colorName = 'status_resolved'; break; case 'closed': colorName = 'status_closed'; break; case 'escalated': colorName = 'status_escalated'; break; default: colorName = 'default'; } return {c: colorName, t: status || 'N/A'}; }; // Simplified: return obj with color key and text
const getPriorityProps = (priority) => { const lp = priority?.toLowerCase()||''; switch(lp){ case 'low': return {i:<KeyboardArrowDownIcon sx={{color:'success.main', fontSize: '1.2rem'}}/>,t:'Low'}; case 'high': return {i:<KeyboardArrowUpIcon sx={{color:'error.main', fontSize: '1.2rem'}}/>,t:'High'}; case 'urgent': return {i:<PriorityHighIcon sx={{color:'error.dark', fontSize: '1.2rem'}}/>,t:'Urgent'}; default: return {i:<RemoveIcon sx={{color:'warning.main', fontSize: '1.2rem'}}/>,t:'Medium'};}};

// --- DashboardTicketRow Component ---
function DashboardTicketRow({ ticket }) {
    if (!ticket) return null;
    const statusProps = getStatusProps(ticket.status);
    const priorityProps = getPriorityProps(ticket.priority);

    // Function to get theme color based on custom status key
    const getChipColor = (colorName, theme) => {
        if (colorName !== 'default' && theme.palette[colorName]) {
             return { bgcolor: theme.palette[colorName].main, color: theme.palette[colorName].contrastText };
        }
        // Return default styles if not a custom status color
        return { bgcolor: theme.palette.action.selected, color: theme.palette.text.secondary };
    }

    return (
        // Use theme within sx prop if needed for dynamic styles
        <Grid container spacing={1} alignItems="center" sx={(theme) => ({
            py: 0.5, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 },
            '&:hover': { bgcolor: 'action.hover' } // Add hover effect
            })}>
            <Grid item xs={2} sm={1}><Typography variant="body2" color="text.secondary">#{ticket.id}</Typography></Grid>
            <Grid item xs={5} sm={4} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                 <Tooltip title={ticket.subject}><Typography variant="body2" sx={{ fontWeight: 500 }}>{ticket.subject}</Typography></Tooltip>
            </Grid>
            <Grid item xs={3} sm={2}>
                 {/* Apply chip color dynamically using theme */}
                 <Chip label={statusProps.t} size="small" sx={(theme) => ({...getChipColor(statusProps.c, theme), textTransform:'capitalize'})} />
            </Grid>
            <Grid item xs={2} sm={1} sx={{ textAlign: 'center' }}><Tooltip title={priorityProps.t}>{priorityProps.i}</Tooltip></Grid>
            <Grid item xs={6} sm={2} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                 <Typography variant="caption">{ticket.assigned_team || ticket.assigned_agent_id || 'Unassigned'}</Typography>
            </Grid>
             <Grid item xs={6} sm={2} sx={{ textAlign: 'right' }}>
                 <Button component={RouterLink} to={`/app/tickets/${ticket.id}`} size="small" variant="outlined" sx={{fontSize: '0.75rem', py: 0.25, px: 1}}>View</Button>
             </Grid>
        </Grid>
    );
}
// --- End DashboardTicketRow ---


// --- Main Dashboard Page Component ---
function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [overviewTickets, setOverviewTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolutionChartData, setResolutionChartData] = useState(null);
  const [agentChartData, setAgentChartData] = useState(null);

  // useEffect to fetch data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true); setError(null); let metricsError = null; let ticketsError = null;
      try {
          const [metricsDataResponse, ticketsResponse] = await Promise.allSettled([
              fetchDashboardMetrics(), // Mock metrics
              getTickets({ status: 'Open', limit: 5 }) // Real tickets
          ]);
          // Process Metrics
          if (metricsDataResponse.status === 'fulfilled') { /* ... set metrics and chart data (same as Response 48) ... */
              const metricsData = metricsDataResponse.value; setMetrics(metricsData);
              if (metricsData?.resolution_times_distribution) { setResolutionChartData({ labels: Object.keys(metricsData.resolution_times_distribution), datasets: [{ label: 'Tickets Resolved', data: Object.values(metricsData.resolution_times_distribution), borderWidth: 1 }] }); } else { setResolutionChartData(null); }
              if (metricsData?.agent_performance?.length > 0) { setAgentChartData({ labels: metricsData.agent_performance.map(a => a.agent_name), datasets: [ { label: 'Tickets Resolved', data: metricsData.agent_performance.map(a => a.resolved_count), yAxisID: 'y', order: 2, borderWidth: 1 }, { label: 'Avg Resolution Time (min)', data: metricsData.agent_performance.map(a => a.avg_time_minutes), type: 'line', yAxisID: 'y1', tension: 0.1, order: 1 } ] }); } else { setAgentChartData(null); }
          } else { console.error("Error fetching metrics:", metricsDataResponse.reason); metricsError = metricsDataResponse.reason?.message || "Failed loading metrics."; setMetrics(null); }
          // Process Tickets
          if (ticketsResponse.status === 'fulfilled') { setOverviewTickets(ticketsResponse.value.data || []); }
          else { console.error("Error fetching tickets:", ticketsResponse.reason); ticketsError = ticketsResponse.reason?.message || "Failed loading tickets."; setOverviewTickets([]); }
          // Set combined error
          if (metricsError || ticketsError) { setError([metricsError, ticketsError].filter(Boolean).join('; ')); }
      } catch (err) { console.error("Unexpected error:", err); setError(err?.message || "Unknown error."); setMetrics(null); setOverviewTickets([]); }
      finally { setLoading(false); }
    };
    loadData();
  }, []); // End useEffect

  // --- Render Logic ---
  if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>; }
  if (!metrics && overviewTickets.length === 0 && error) { return <Alert severity="error" sx={{m:2}}>Error loading dashboard: {error}</Alert>; }
  if (!metrics && overviewTickets.length === 0) { return <Typography sx={{ m: 2 }}>No dashboard data available.</Typography>; }

  const userName = user?.full_name || user?.username || 'User';

  return (
    <Box>
       <Typography variant="h4" sx={{ mb: 1 }}>Welcome, {userName}.</Typography>
       <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>Here's today's support operations summary.</Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>} {/* Show non-fatal errors */}

      {/* Metrics Grid */}
      {metrics && ( /* Only render metrics if available */
        <Grid container spacing={3} sx={{ mb: 4 }}>
           {/* ... Metric Grid items ... */}
           <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Open Tickets" icon={<PendingActionsIcon />} value={metrics.open_tickets?.value} comparison={metrics.open_tickets?.comparison} /> </Grid>
           <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Resolved (24h)" icon={<CheckCircleOutlineIcon />} value={metrics.resolved_last_24h?.value} comparison={metrics.resolved_last_24h?.comparison} /> </Grid>
           <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Avg. Response Time" icon={<SpeedIcon />} value={metrics.avg_response_time_mins?.value} unit="min" comparison={metrics.avg_response_time_mins?.comparison} /> </Grid>
           <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="SLA Met" icon={<QueryStatsIcon />} value={metrics.sla_met_rate?.value} unit="%" comparison={metrics.sla_met_rate?.comparison} /> </Grid>
           <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Avg. Resolution Time" icon={<AccessTimeIcon />} value={metrics.avg_resolution_time_hours?.value} unit="hrs" comparison={metrics.avg_resolution_time_hours?.comparison}/> </Grid>
           <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="CSAT Score" icon={<ThumbUpAltOutlinedIcon />} value={metrics.customer_satisfaction?.value} unit="%" comparison={metrics.customer_satisfaction?.comparison} comparisonLabel="vs last week" /> </Grid>
           <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Active Escalations" icon={<ReportProblemOutlinedIcon />} value={metrics.escalations?.active} comparison={metrics.escalations?.comparison} comparisonLabel="Total vs yesterday" /> </Grid>
        </Grid>
      )}

       {/* Main Area Grid */}
       <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Tickets Overview */}
            <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mb: 1}}>
                         <Typography variant="h6">Recent Open Tickets</Typography>
                         <Button component={RouterLink} to="/app/tickets" size="small">View All</Button>
                    </Stack> <Divider sx={{mb: 1}} />
                    {overviewTickets.length > 0 ? (
                         <Box sx={{ flexGrow: 1 }}> {overviewTickets.map(ticket => <DashboardTicketRow key={ticket.id} ticket={ticket} />)} </Box>
                    ) : ( <Box sx={{display:'flex', alignItems:'center', justifyContent:'center', flexGrow: 1, minHeight: 150}}> <Typography color="text.secondary">{error ? 'Error loading tickets' : 'No open tickets found.'}</Typography> </Box> )}
                </Paper>
            </Grid>
            {/* AI Operations Panel */}
            {metrics && ( /* Only render if metrics exist */
                <Grid item xs={12} lg={4}>
                     <Stack spacing={2} sx={{ height: '100%' }}>
                          <Paper sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Typography variant="h6" sx={{mb: 1}}>AI Operations Panel</Typography> <Divider />
                              <Box> <Typography variant="subtitle2" gutterBottom sx={{display: 'flex', alignItems: 'center'}}><SummarizeIcon fontSize='small' sx={{mr:0.5, color:'text.secondary'}}/> Today's AI Summary</Typography> <Typography variant="body2" color="text.secondary"> {metrics.ai_summary_today?.split('**').map((text, index) => index % 2 === 1 ? <strong key={index}>{text}</strong> : text)} </Typography> </Box> <Divider />
                              <Box> <Typography variant="subtitle2" gutterBottom sx={{display: 'flex', alignItems: 'center'}}><AccessAlarmsIcon fontSize='small' sx={{mr:0.5, color:'text.secondary'}}/> Resolution Estimates</Typography> {metrics.ai_resolution_estimates?.map((est, i) => ( <Box key={i} sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}> <Typography variant="body2" color="text.secondary">{est.type}</Typography> <Typography variant="body2" sx={{fontWeight: 500}}>{est.time}</Typography> </Box> ))} </Box> <Divider />
                              <Box> <Typography variant="subtitle2" gutterBottom sx={{display: 'flex', alignItems: 'center'}}><RecommendIcon fontSize='small' sx={{mr:0.5, color:'text.secondary'}}/> Suggested Articles</Typography> {metrics.ai_suggested_articles?.map((article) => ( <MuiLink component={RouterLink} to={`/app/kb/${article.id}`} key={article.id} variant="body2" display="block" sx={{mb: 0.5, textDecoration: 'none', '&:hover': {textDecoration: 'underline'}}}>{article.id}: {article.title}</MuiLink> ))} </Box> <Divider />
                              <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />} sx={{alignItems: 'center'}}> <Typography variant="body2" sx={{fontWeight: 500}}>{metrics.ai_risk_alerts?.count} {metrics.ai_risk_alerts?.message}</Typography> </Alert>
                          </Paper>
                      </Stack>
                 </Grid>
             )}
       </Grid>

      {/* Charts Row */}
      {metrics && ( /* Only render if metrics exist */
        <>
          <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>Performance Charts</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}> <Paper sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}> <ResolutionTimeChart data={resolutionChartData} /> </Paper> </Grid>
            <Grid item xs={12} lg={6}> <Paper sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}> <AgentPerformanceChart data={agentChartData} /> </Paper> </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

export default DashboardPage;