// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';

// Import chart components (ensure these files exist and are correct)
import ResolutionTimeChart from '../components/charts/ResolutionTimeChart.js';
import AgentPerformanceChart from '../components/charts/AgentPerformanceChart.js';
// Import the API service function (keep commented until backend endpoint exists)
// import { getDashboardMetrics } from '../services/api.js';

// Mock Data Function (Replace with actual API call later)
const fetchDashboardData = async () => {
    console.log("Fetching dashboard data (mock)...");
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));

    // Simulate potential API error randomly
    // if (Math.random() < 0.2) {
    //    throw new Error("Random mock API error");
    // }

    // More realistic mock data
    return {
        total_tickets: 1380,
        open_tickets: 85,
        avg_resolution_time_hours: 4.2,
        sla_compliance_rate: 93.1,
        agent_performance: [
            { agent_name: 'Alice', resolved_count: 165, avg_time_minutes: 170 },
            { agent_name: 'Bob', resolved_count: 130, avg_time_minutes: 225 },
            { agent_name: 'Charlie', resolved_count: 105, avg_time_minutes: 260 },
            { agent_name: 'Diana', resolved_count: 190, avg_time_minutes: 145 },
            { agent_name: 'Eve', resolved_count: 115, avg_time_minutes: 200 },
        ],
        resolution_times_distribution: {
            '< 1h': 350,
            '1-4h': 580,
            '4-12h': 280,
            '12-24h': 110,
            '> 24h': 60,
        },
    };
}; // <-- Closing brace for fetchDashboardData function

function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for formatted chart data
  const [resolutionChartData, setResolutionChartData] = useState(null);
  const [agentChartData, setAgentChartData] = useState(null);

  // useEffect hook runs after the component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        // --- Replace with actual API call when ready ---
        // TODO: Implement GET /dashboard/metrics endpoint in backend
        // const response = await getDashboardMetrics(); // Actual API call
        // const data = response.data; // Assuming API returns data in response.data
        const data = await fetchDashboardData(); // Using mock function for now
        // ------------------------------------------------
        setMetrics(data); // Update metrics state

        // --- Format data for charts ---
        // Check if data and the specific property exist before processing
        if (data && data.resolution_times_distribution) {
          setResolutionChartData({
            labels: Object.keys(data.resolution_times_distribution),
            datasets: [{ // Start of datasets array for resolution chart
              label: 'Tickets Resolved', // This label appears in tooltips/legend
              data: Object.values(data.resolution_times_distribution),
              backgroundColor: [ // Example colors - can be customized
                  'rgba(75, 192, 192, 0.6)',   // Teal
                  'rgba(54, 162, 235, 0.6)',  // Blue
                  'rgba(255, 206, 86, 0.6)',  // Yellow
                  'rgba(255, 159, 64, 0.6)',  // Orange
                  'rgba(255, 99, 132, 0.6)',   // Red
                  'rgba(153, 102, 255, 0.6)'   // Purple
              ],
              borderColor: [ // Optional borders matching background colors
                   'rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)',
                   'rgba(255, 206, 86, 1)', 'rgba(255, 159, 64, 1)',
                   'rgba(255, 99, 132, 1)', 'rgba(153, 102, 255, 1)'
               ],
               borderWidth: 1
            }] // <-- Closing bracket for datasets array
          }); // <-- Closing parenthesis for setResolutionChartData call
        } else {
            console.warn("Resolution time distribution data missing from fetched metrics.");
            setResolutionChartData(null); // Set to null if data missing
        } // <-- Closing brace for the first if statement

        // Check if data and the specific property exist and have items
        if (data && data.agent_performance && data.agent_performance.length > 0) {
           setAgentChartData({
              labels: data.agent_performance.map(a => a.agent_name),
              datasets: [ // Start of datasets array for agent chart
                  {
                      label: 'Tickets Resolved',
                      data: data.agent_performance.map(a => a.resolved_count),
                      backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue bars
                      borderColor: 'rgba(54, 162, 235, 1)',
                      borderWidth: 1,
                      yAxisID: 'y', // Assign to the left y-axis (defined in component options)
                      order: 2 // Render bars behind line
                  }, // <-- Comma between dataset objects
                  {
                      label: 'Avg Resolution Time (min)',
                      data: data.agent_performance.map(a => a.avg_time_minutes),
                      borderColor: 'rgba(255, 99, 132, 1)', // Red line
                      backgroundColor: 'rgba(255, 99, 132, 0.5)', // Point color
                      type: 'line', // Display as a line
                      yAxisID: 'y1', // Assign to the right y-axis
                      tension: 0.1, // Slight curve to line
                      order: 1 // Render line in front
                  }
              ] // <-- Closing bracket for datasets array
           }); // <-- Closing parenthesis for setAgentChartData call
        } else {
             console.warn("Agent performance data missing or empty from fetched metrics.");
             setAgentChartData(null); // Set to null if data missing
        } // <-- Closing brace for the second if statement
        // -----------------------------

      } catch (err) { // <-- Closing brace for try block
        console.error("Error fetching/processing dashboard data:", err);
        // Use the message from the caught error object if available (from interceptor)
        setError(err?.message || "Failed to load dashboard data.");
        setMetrics(null); // Clear metrics on error
        setResolutionChartData(null);
        setAgentChartData(null);
      } finally { // <-- Closing brace for catch block
        setLoading(false);
      } // <-- Closing brace for finally block
    }; // <-- Closing brace for loadData async function

    loadData(); // Call loadData within useEffect
  }, []); // Empty dependency array means run only once on mount

  // Display loading state
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
  }

  // Display error if loading finished but data is still null (implies error occurred)
  if (error && !metrics) {
    return <Typography color="error" sx={{ m: 2, p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}>Error loading dashboard: {error}</Typography>;
  }

  // Handle case where loading finished, no error, but metrics are somehow null/undefined
  if (!metrics) {
      return <Typography sx={{ m: 2 }}>No dashboard data available.</Typography>;
  }

  // Render the main dashboard content
  return (
    <Box> {/* Opening Box */}
      <Typography variant="h4" gutterBottom>
        Support Dashboard
      </Typography>

      {/* Display error alongside data if an error occurred but some metrics might still exist */}
      {error && <Typography color="warning.main" sx={{ mb: 2 }}>Warning: {error}</Typography>}

      <Grid container spacing={3}> {/* Opening Grid container */}
        {/* Key Metrics Cards - Use nullish coalescing (??) for safer defaults */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6">Total Tickets</Typography>
            <Typography variant="h4">{metrics.total_tickets ?? 'N/A'}</Typography>
          </Paper>
        </Grid>
         <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6">Open Tickets</Typography>
            <Typography variant="h4">{metrics.open_tickets ?? 'N/A'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6">Avg Resolution (Hours)</Typography>
            <Typography variant="h4">{metrics.avg_resolution_time_hours?.toFixed(1) ?? 'N/A'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6">SLA Compliance</Typography>
            <Typography variant="h4">{metrics.sla_compliance_rate?.toFixed(1) ?? 'N/A'}%</Typography>
          </Paper>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} lg={6}> {/* Use lg breakpoint for wider screens */}
          <Paper sx={{ p: 2, height: '100%' }}> {/* Ensure paper takes grid item height */}
            {/* Chart component handles its own title now */}
            <ResolutionTimeChart data={resolutionChartData} />
          </Paper>
        </Grid>
         <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <AgentPerformanceChart data={agentChartData} />
          </Paper>
        </Grid>

      </Grid> {/* Closing Grid container */}
    </Box> // Closing Box
  ); // Closing return parentheses
} // Closing function DashboardPage

// This should be the only export default on the page
export default DashboardPage;