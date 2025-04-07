// frontend/src/components/charts/AgentPerformanceChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2'; // Bar chart can handle mixed types (bar/line)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, // Needed for line chart points
  LineElement,  // Needed for line chart lines
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Box, Typography } from '@mui/material';

// Register necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false, // Allow chart to fit container height
  interaction: { // Better tooltip handling for mixed charts
        mode: 'index', // Show tooltip for all datasets at that index
        intersect: false, // Don't require direct hover over point/bar
  },
  plugins: {
    legend: {
      position: 'top',
       labels: { padding: 15 }
    },
    title: {
      display: true,
      text: 'Agent Performance Overview',
       padding: { top: 10, bottom: 10 }
    },
     tooltip: {
        callbacks: { // Customize tooltip labels
             label: function(context) {
                 let label = context.dataset.label || '';
                 if (label) { label += ': '; }
                 if (context.parsed.y !== null) {
                      // Add units based on dataset label
                     if(context.dataset.label?.toLowerCase().includes('time')){
                         label += context.parsed.y + ' min';
                     } else {
                          label += context.parsed.y;
                     }
                 }
                 return label;
             }
        }
    }
  },
   scales: {
      y: { // Left Y-axis (for resolved count - Bar)
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
           title: {
               display: true,
               text: 'Tickets Resolved'
          },
           grid: {
              color: '#e0e0e0',
           },
           ticks: {
                precision: 0
           }
      },
      y1: { // Right Y-axis (for avg time - Line)
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true, // Or false if times can be very small
           title: {
               display: true,
               text: 'Avg Resolution Time (min)'
          },
          // Ensure grid lines from this axis don't clash visually
          grid: {
              drawOnChartArea: false, // Only draw grid lines for the first Y axis
          },
      },
      x: {
           title: {
               display: true,
               text: 'Agent'
           },
            grid: {
              display: false
           }
      }
  }
};

function AgentPerformanceChart({ data }) {
  const chartData = data || { labels: [], datasets: [] };
  return (
    <Box sx={{ height: 350, position: 'relative' }}> {/* Wrapper */}
       {chartData.labels.length > 0 ? (
            <Bar options={options} data={chartData} /> // Use Bar component for mixed type
         ) : (
             <Typography sx={{textAlign: 'center', mt: 4}}>No agent performance data available.</Typography>
         )}
    </Box>
  );
}

export default AgentPerformanceChart;