// frontend/src/components/charts/ResolutionTimeChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Box, Typography } from '@mui/material';

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false, // Allow chart to fit container height
  plugins: {
    legend: {
      position: 'top',
      labels: { padding: 15 }
    },
    title: {
      display: true, // Use chart title
      text: 'Ticket Resolution Time Distribution',
      padding: { top: 10, bottom: 10 }
    },
    tooltip: {
        callbacks: {
             label: function(context) {
                 let label = context.dataset.label || '';
                 if (label) { label += ': '; }
                 if (context.parsed.y !== null) {
                     label += context.parsed.y + ' tickets';
                 }
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
               text: 'Number of Tickets'
          },
           grid: {
              color: '#e0e0e0', // Lighter grid lines
           },
           ticks: {
                precision: 0 // Ensure whole numbers on y-axis
           }
      },
      x: {
           grid: {
              display: false // Hide vertical grid lines
           }
      }
  }
};

function ResolutionTimeChart({ data }) {
  // Provide default data structure if data is null/undefined to prevent errors
  const chartData = data || { labels: [], datasets: [] };

  // Set a fixed height or use aspect ratio if maintainAspectRatio is true
  return (
    <Box sx={{ height: 350, position: 'relative' }}> {/* Wrapper with fixed height */}
        {chartData.labels.length > 0 ? (
            <Bar options={options} data={chartData} />
        ) : (
             <Typography sx={{textAlign: 'center', mt: 4}}>No resolution time data available.</Typography>
        )}
    </Box>
  );
}

export default ResolutionTimeChart;