// frontend/src/pages/DashboardPage.jsx (or .js)
import React, { useState, useEffect } from 'react';
import {
    Grid, Paper, Typography, Box, CircularProgress, Card, CardContent,
    Divider, Alert, Link as MuiLink, Stack // Added Card, CardContent, Divider, Alert, MuiLink, Stack
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
import Button from '@mui/material/Button'; // Import Button if using later
// Import Auth hook
import { useAuth } from '../context/AuthContext.js'; // Use .js or .jsx
// Import RouterLink for navigation links
import { Link as RouterLink } from 'react-router-dom';
// Import API service (keep commented)
// import { getDashboardMetrics } from '../services/api.js';


// --- Mock Data Function (Updated) ---
const fetchDashboardData = async () => {
    console.log("Fetching dashboard data (mock)...");
    await new Promise(resolve => setTimeout(resolve, 700));
    return {
        open_tickets: { value: 42, comparison: 12 }, resolved_last_24h: { value: 18, comparison: -8 },
        avg_response_time_mins: { value: 14, comparison: 3, target: 15 }, sla_met_rate: { value: 92, comparison: -1 },
        avg_resolution_time_hours: { value: 3.2, comparison: -5 }, customer_satisfaction: { value: 94, comparison: 2, nps: 76 },
        escalations: { value: 7, comparison: 2, active: 3, resolved: 4 },
        agent_performance: [ { agent_name: 'Alice', resolved_count: 165, avg_time_minutes: 170 }, { agent_name: 'Bob', resolved_count: 130, avg_time_minutes: 225 }, { agent_name: 'Charlie', resolved_count: 105, avg_time_minutes: 260 }, { agent_name: 'Diana', resolved_count: 190, avg_time_minutes: 145 }, { agent_name: 'Eve', resolved_count: 115, avg_time_minutes: 200 }, ],
        resolution_times_distribution: { '< 1h': 350, '1-4h': 580, '4-12h': 280, '12-24h': 110, '> 24h': 60, },
        ai_summary_today: "Based on current patterns, expect to resolve **12 more tickets** today.",
        ai_resolution_estimates: [ { type: 'API Connection Issues', time: '~45 min' }, { type: 'Login/Authentication', time: '~30 min' }, { type: 'Billing Questions', time: '~15 min' } ],
        ai_suggested_articles: [ { id: 'KB-2345', title: 'Troubleshooting API Connection Issues' }, { id: 'KB-1038', title: 'Common Login Error Solutions' }, { id: 'KB-5621', title: 'Mobile App Authentication Guide' } ],
        ai_risk_alerts: { count: 5, message: 'tickets flagged as potential churn risks.'}
    };
}; // --- End Mock Data ---


// --- Reusable Metric Card Component ---
function MetricCard({ title, value, unit = '', comparison = null, comparisonLabel = "vs yesterday", icon = null }) {
    const trendIcon = comparison === null ? null : (comparison > 0 ? <TrendingUpIcon sx={{ fontSize: '1rem', color: 'success.main', ml: 0.5 }}/> : (comparison < 0 ? <TrendingDownIcon sx={{ fontSize: '1rem', color: 'error.main', ml: 0.5 }}/> : <HorizontalRuleIcon sx={{ fontSize: '1rem', color: 'action.active', ml: 0.5 }}/>));
    const comparisonText = comparison !== null ? `${comparison > 0 ? '+' : ''}${comparison}% ${comparisonLabel}` : '';
    const comparisonColor = comparison === null ? 'text.secondary' : (comparison >= 0 ? 'success.main' : 'error.main');
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}> {title} </Typography>
                    {icon && React.cloneElement(icon, { sx: { fontSize: '1.4rem', color: 'action.active' }})}
                </Box>
                <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2, mb: 0.5 }}> {value ?? 'N/A'} {value !== null && unit && <Typography variant="h6" component="span" sx={{ ml: 0.5, fontWeight: 500, color: 'text.secondary', fontSize: '1.1rem' }}>{unit}</Typography>} </Typography>
                     {comparison !== null && ( <Box sx={{display: 'flex', alignItems: 'center', mt: 0.5}}> {trendIcon} <Typography variant="caption" sx={{ color: comparisonColor, fontWeight: 500 }}> {comparisonText} </Typography> </Box> )}
                </Box>
            </CardContent>
        </Card>
   );
} // --- End Metric Card ---


// --- Main Dashboard Page Component ---
function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolutionChartData, setResolutionChartData] = useState(null);
  const [agentChartData, setAgentChartData] = useState(null);

  // useEffect hook to fetch data and format charts
  useEffect(() => {
    const loadData = async () => {
      try { setLoading(true); setError(null);
        const data = await fetchDashboardData(); // Using mock
        setMetrics(data);
        // Format Resolution Data
        if (data?.resolution_times_distribution) { setResolutionChartData({ labels: Object.keys(data.resolution_times_distribution), datasets: [{ label: 'Tickets Resolved', data: Object.values(data.resolution_times_distribution), backgroundColor: [ 'rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(153, 102, 255, 0.6)' ], borderColor: [ 'rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 159, 64, 1)', 'rgba(255, 99, 132, 1)', 'rgba(153, 102, 255, 1)' ], borderWidth: 1 }] }); } else { setResolutionChartData(null); }
        // Format Agent Data
        if (data?.agent_performance?.length > 0) { setAgentChartData({ labels: data.agent_performance.map(a => a.agent_name), datasets: [ { label: 'Tickets Resolved', data: data.agent_performance.map(a => a.resolved_count), backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1, yAxisID: 'y', order: 2 }, { label: 'Avg Resolution Time (min)', data: data.agent_performance.map(a => a.avg_time_minutes), borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.5)', type: 'line', yAxisID: 'y1', tension: 0.1, order: 1 } ] }); } else { setAgentChartData(null); }
      } catch (err) { console.error("Error fetching dashboard data:", err); setError(err?.message || "Failed to load dashboard data."); setMetrics(null); setResolutionChartData(null); setAgentChartData(null); } finally { setLoading(false); }
    };
    loadData();
  }, []); // End useEffect

  // --- Render Logic ---
  if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>; }
  if (error && !metrics) { return <Alert severity="error" sx={{m:2}}>Error loading dashboard: {error}</Alert>; }
  if (!metrics) { return <Typography sx={{ m: 2 }}>No dashboard data available.</Typography>; }

  const userName = user?.full_name || user?.username || 'User';

  return (
    <Box>
       <Typography variant="h4" sx={{ mb: 1 }}>Welcome, {userName}.</Typography>
       <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>Here's today's support operations summary.</Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>Warning: {error}</Alert>}

      {/* --- Metrics Rows --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Open Tickets" icon={<PendingActionsIcon />} value={metrics.open_tickets?.value} comparison={metrics.open_tickets?.comparison} /> </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Resolved (24h)" icon={<CheckCircleOutlineIcon />} value={metrics.resolved_last_24h?.value} comparison={metrics.resolved_last_24h?.comparison} /> </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Avg. Response Time" icon={<SpeedIcon />} value={metrics.avg_response_time_mins?.value} unit="min" comparison={metrics.avg_response_time_mins?.comparison} /> </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="SLA Met" icon={<QueryStatsIcon />} value={metrics.sla_met_rate?.value} unit="%" comparison={metrics.sla_met_rate?.comparison} /> </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Avg. Resolution Time" icon={<AccessTimeIcon />} value={metrics.avg_resolution_time_hours?.value} unit="hrs" comparison={metrics.avg_resolution_time_hours?.comparison}/> </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="CSAT Score" icon={<ThumbUpAltOutlinedIcon />} value={metrics.customer_satisfaction?.value} unit="%" comparison={metrics.customer_satisfaction?.comparison} comparisonLabel="vs last week" /> </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}> <MetricCard title="Active Escalations" icon={<ReportProblemOutlinedIcon />} value={metrics.escalations?.active} comparison={metrics.escalations?.comparison} comparisonLabel="Total vs yesterday" /> </Grid>
      </Grid>

       {/* --- Main Area: Tickets Overview & AI Panel --- */}
       <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 2, height: '100%' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mb: 2}}>
                         <Typography variant="h6">Tickets Overview</Typography>
                         {/* TODO: Add New Ticket / Filter buttons here */}
                    </Stack>
                     <Typography variant="body2" color="text.secondary"> (Condensed ticket list table will go here) </Typography>
                     <Box sx={{mt: 2, height: 300, border: '1px dashed', borderColor: 'divider', display:'flex', alignItems:'center', justifyContent:'center'}}> <Typography color="text.secondary">Ticket Table Placeholder</Typography> </Box>
                </Paper>
            </Grid>

             {/* --- Enhanced AI Operations Panel --- */}
             <Grid item xs={12} lg={4}>
                 {/* Use Stack for vertical spacing of Paper elements inside */}
                 <Stack spacing={2} sx={{ height: '100%' }}>
                      {/* Main AI Panel content */}
                      <Paper sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Typography variant="h6" sx={{mb: 1}}>AI Operations Panel</Typography>
                          <Divider />
                          {/* AI Summary Today */}
                          <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{display: 'flex', alignItems: 'center'}}><SummarizeIcon fontSize='small' sx={{mr:0.5, color:'text.secondary'}}/> Today's AI Summary</Typography>
                              <Typography variant="body2" color="text.secondary"> {metrics.ai_summary_today?.split('**').map((text, index) => index % 2 === 1 ? <strong key={index}>{text}</strong> : text)} </Typography>
                          </Box> <Divider />
                          {/* Time Estimates */}
                          <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{display: 'flex', alignItems: 'center'}}><AccessAlarmsIcon fontSize='small' sx={{mr:0.5, color:'text.secondary'}}/> Resolution Estimates</Typography>
                              {metrics.ai_resolution_estimates?.map((est, i) => ( <Box key={i} sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}> <Typography variant="body2" color="text.secondary">{est.type}</Typography> <Typography variant="body2" sx={{fontWeight: 500}}>{est.time}</Typography> </Box> ))}
                          </Box> <Divider />
                           {/* Suggested Articles */}
                           <Box>
                               <Typography variant="subtitle2" gutterBottom sx={{display: 'flex', alignItems: 'center'}}><RecommendIcon fontSize='small' sx={{mr:0.5, color:'text.secondary'}}/> Suggested Articles</Typography>
                                {metrics.ai_suggested_articles?.map((article) => ( <MuiLink component={RouterLink} to={`/app/kb/${article.id}`} /* Example link */ key={article.id} variant="body2" display="block" sx={{mb: 0.5, textDecoration: 'none', '&:hover': {textDecoration: 'underline'}}}>{article.id}: {article.title}</MuiLink> ))}
                           </Box> <Divider />
                           {/* Risk Alerts */}
                           <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />} sx={{alignItems: 'center'}}>
                               <Typography variant="body2" sx={{fontWeight: 500}}>{metrics.ai_risk_alerts?.count} {metrics.ai_risk_alerts?.message}</Typography>
                           </Alert>
                           {/* Add Action Button if needed */}
                           {/* <Button variant="contained" fullWidth sx={{mt: 'auto'}}>Apply AI Recs</Button> */}
                      </Paper>
                       {/* Optional: Add another small card below */}
                       {/* <Paper sx={{ p: 2 }}> <Typography variant="h6">Quick Actions</Typography> </Paper> */}
                  </Stack>
             </Grid>
             {/* --- End AI Panel --- */}
       </Grid>

      {/* --- Charts Row --- */}
      <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>Performance Charts</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}> <Paper sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}> <ResolutionTimeChart data={resolutionChartData} /> </Paper> </Grid>
        <Grid item xs={12} lg={6}> <Paper sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}> <AgentPerformanceChart data={agentChartData} /> </Paper> </Grid>
      </Grid>

    </Box> // End main Box
  ); // End return
} // End function DashboardPage

export default DashboardPage;