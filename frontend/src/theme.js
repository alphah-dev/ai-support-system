// frontend/src/theme.js
import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example MUI blue
    },
    secondary: {
      main: '#dc004e', // Example MUI pink
    },
    background: {
      default: '#f4f6f8', // Light grey background
      paper: '#ffffff',   // White for paper elements like cards, menus
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
       fontWeight: 600,
       marginBottom: '1rem', // Add some default spacing
    },
    h5: {
      fontWeight: 600,
       marginBottom: '0.8rem',
    },
     h6: {
      fontWeight: 600,
       marginBottom: '0.5rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper, // Make AppBar white
            color: theme.palette.text.primary, // Use default text color
            boxShadow: theme.shadows[1], // Add subtle shadow
        }),
      },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper, // White sidebar
                borderRight: `1px solid ${theme.palette.divider}`,
            })
        }
    },
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none', // Prevent default uppercase
                borderRadius: '8px', // Slightly rounder buttons
            }
        }
    },
    MuiPaper: {
         styleOverrides: {
             root: {
                 borderRadius: '8px', // Rounded corners for paper elements
             }
         }
    },
     MuiChip: {
         styleOverrides: {
             root: {
                 borderRadius: '6px', // Consistent rounding
             }
         }
     }
  }
});

export default theme;