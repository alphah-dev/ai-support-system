// frontend/src/components/charts/AgentPerformanceChart.js (or .jsx)
import React from 'react';
import { Bar } from 'react-chartjs-2'; // Bar component handles mixed types
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, LineController, BarController // Need controllers for mixed types
} from 'chart.js';
import { Box, Typography, useTheme } from '@mui/material'; // Import useTheme
import { alpha } from '@mui/material/styles'; // Import alpha utility for transparency

// Register necessary Chart.js components including controllers
ChartJS.register( CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, LineController, BarController );

function AgentPerformanceChart({ data }) {
  const theme = useTheme(); // Get the current MUI theme

  // Define chart options dynamically using the theme
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { padding: 15, color: theme.palette.text.secondary, font: { size: 11 } }
      },
      title: {
        display: true,
        text: 'Agent Performance Overview',
        padding: { top: 10, bottom: 20 },
        color: theme.palette.text.primary,
        font: { size: 16, weight: '600' }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 10,
        callbacks: { // Customize tooltip labels
             label: function(context) {
                 let label = context.dataset.label || '';
                 if (label) { label += ': '; }
                 if (context.parsed.y !== null) {
                      if(context.dataset.label?.toLowerCase().includes('time')){ label += context.parsed.y + ' min'; }
                      else { label += context.parsed.y; }
                 }
                 return label;
             }
        }
      }
    },
     scales: {
        // Left Y-axis (for resolved count - Bar)
        y: {
            type: 'linear', display: true, position: 'left', beginAtZero: true,
            title: { display: true, text: 'Tickets Resolved', color: theme.palette.text.secondary, font: { size: 12 } },
            grid: { color: theme.palette.divider },
            ticks: { precision: 0, color: theme.palette.text.secondary }
        },
        // Right Y-axis (for avg time - Line)
        y1: {
            type: 'linear', display: true, position: 'right', beginAtZero: true,
            title: { display: true, text: 'Avg Resolution Time (min)', color: theme.palette.text.secondary, font: { size: 12 } },
            grid: { drawOnChartArea: false }, // Only show primary y-axis grid
            ticks: { color: theme.palette.text.secondary }
        },
        // X-axis (Agents)
        x: {
             title: { display: false, /* text: 'Agent' */ }, // Title often redundant here
             grid: { display: false }, // Hide vertical grid lines
             ticks: { color: theme.palette.text.secondary }
        }
    }
  };

   // Prepare dataset with theme colors (if data exists)
   // Assign colors based on dataset type (bar vs line)
   const themedChartData = data ? {
       ...data,
       datasets: data.datasets.map(dataset => {
            if (dataset.type === 'line') {
                 return {
                    ...dataset,
                    borderColor: theme.palette.error.main, // Use theme error color for line
                    pointBackgroundColor: theme.palette.error.main,
                    pointBorderColor: theme.palette.background.paper, // Point border matches background
                    pointHoverRadius: 6,
                    pointRadius: 4,
                    fill: true, // Fill area under line
                    backgroundColor: alpha(theme.palette.error.main, 0.1), // Use transparent version of border color
                 };
            } else { // Assume bar chart otherwise
                 return {
                    ...dataset,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.7), // Use theme secondary color with transparency
                    borderColor: theme.palette.secondary.main,
                    hoverBackgroundColor: theme.palette.secondary.dark,
                    borderRadius: 4, // Add rounded corners
                 };
            }
       })
   } : { labels: [], datasets: [] };


  return (
    <Box sx={{ height: 350, position: 'relative' }}>
       {themedChartData.labels.length > 0 ? (
            // Chart component type doesn't strictly matter for mixed charts in v4+
            <Bar options={options} data={themedChartData} />
         ) : (
             <Typography sx={{textAlign: 'center', mt: 4, color: 'text.secondary'}}>No agent performance data available.</Typography>
         )}
    </Box>
  );
}

export default AgentPerformanceChart;