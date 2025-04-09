// frontend/src/components/charts/ResolutionTimeChart.js (or .jsx)
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Box, Typography, useTheme } from '@mui/material'; // Import useTheme

// Register Chart.js components
ChartJS.register( CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend );

function ResolutionTimeChart({ data }) {
  const theme = useTheme(); // Get the current MUI theme

  // Define chart options dynamically using the theme
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
             padding: 15,
             color: theme.palette.text.secondary, // Use theme text color
             font: { size: 11 } // Smaller legend font
        }
      },
      title: {
        display: true,
        text: 'Ticket Resolution Time Distribution',
        padding: { top: 10, bottom: 20 }, // Increased bottom padding
        color: theme.palette.text.primary, // Use theme text color
        font: { size: 16, weight: '600' } // Match h6-ish style
      },
      tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker tooltip
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          padding: 10,
          callbacks: {
               label: function(context) {
                   let label = context.dataset.label || '';
                   if (label) { label += ': '; }
                   if (context.parsed.y !== null) { label += context.parsed.y + ' tickets'; }
                   return label;
               }
          }
      }
    },
    scales: {
        y: {
            beginAtZero: true,
            title: {
                 display: true,
                 text: 'Number of Tickets',
                 color: theme.palette.text.secondary,
                 font: { size: 12 }
            },
            grid: {
                color: theme.palette.divider, // Use theme divider color
             },
             ticks: {
                  precision: 0,
                  color: theme.palette.text.secondary // Use theme text color
             }
        },
        x: {
             grid: {
                display: false // Hide vertical grid lines for cleaner look
             },
             ticks: {
                  color: theme.palette.text.secondary // Use theme text color
             }
        }
    },
    // Apply styling to the bars themselves
    elements: {
        bar: {
            borderRadius: 4, // Add rounded corners to bars
            // borderSkipped: 'bottom', // Optional: Skip border on bottom
        }
    }
  };

  // Prepare dataset with theme colors (if data exists)
  const themedChartData = data ? {
      ...data,
      datasets: data.datasets.map(dataset => ({
          ...dataset,
          backgroundColor: theme.palette.primary.light, // Use a theme color shade
          borderColor: theme.palette.primary.main,
          hoverBackgroundColor: theme.palette.primary.main, // Darken on hover
          // Can also provide an array of colors here if needed
      }))
  } : { labels: [], datasets: [] }; // Default empty structure

  return (
    <Box sx={{ height: 350, position: 'relative' }}>
        {themedChartData.labels.length > 0 ? (
            <Bar options={options} data={themedChartData} />
        ) : (
             <Typography sx={{textAlign: 'center', mt: 4, color: 'text.secondary'}}>No resolution time data available.</Typography>
        )}
    </Box>
  );
}

export default ResolutionTimeChart;