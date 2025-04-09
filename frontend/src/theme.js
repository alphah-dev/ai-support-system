// frontend/src/theme.js
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// --- Define Base Palettes ---
const lightPalette = {
  primary: { main: '#26a69a', contrastText: '#ffffff' }, // Teal
  secondary: { main: '#ffab40', contrastText: 'rgba(0,0,0,0.87)' }, // Amber accent
  error: { main: red.A400 },
  background: { default: '#f0f2f5', paper: '#ffffff' },
  text: { primary: '#1C2025', secondary: '#5A7184' },
  divider: 'rgba(0, 0, 0, 0.08)',
  action: { active: 'rgba(0, 0, 0, 0.54)', hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(0, 0, 0, 0.08)', disabled: 'rgba(0, 0, 0, 0.26)', disabledBackground: 'rgba(0, 0, 0, 0.12)', focus: 'rgba(0, 0, 0, 0.12)' },
  status_open: { main: '#03a9f4', contrastText: '#fff' },
  status_inprogress: { main: '#ffc107', contrastText: 'rgba(0,0,0,0.87)' },
  status_resolved: { main: '#4caf50', contrastText: '#fff' },
  status_closed: { main: '#9e9e9e', contrastText: '#fff' },
  status_escalated: { main: '#f44336', contrastText: '#fff' },
};

const darkPalette = {
  primary: { main: '#4db6ac', contrastText: 'rgba(0,0,0,0.87)' }, // Lighter Teal
  secondary: { main: '#ffc97a', contrastText: 'rgba(0,0,0,0.87)' }, // Lighter Amber
  error: { main: red[500] },
  background: { default: '#121212', paper: '#1e1e1e' },
  text: { primary: '#e0e0e0', secondary: '#a0a0a0' },
  divider: 'rgba(255, 255, 255, 0.12)',
  action: { active: '#ffffff', hover: 'rgba(255, 255, 255, 0.08)', selected: 'rgba(255, 255, 255, 0.16)', disabled: 'rgba(255, 255, 255, 0.3)', disabledBackground: 'rgba(255, 255, 255, 0.12)', focus: 'rgba(255, 255, 255, 0.12)' },
  status_open: { main: '#4fc3f7', contrastText: 'rgba(0,0,0,0.87)' },
  status_inprogress: { main: '#ffd54f', contrastText: 'rgba(0,0,0,0.87)' },
  status_resolved: { main: '#81c784', contrastText: 'rgba(0,0,0,0.87)' },
  status_closed: { main: '#e0e0e0', contrastText: 'rgba(0,0,0,0.87)' },
  status_escalated: { main: '#e57373', contrastText: '#fff' },
};

// --- Base Theme Options (Shared) ---
const baseThemeOptions = {
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700, fontSize: '1.8rem', marginBottom: '1.2rem' },
        h5: { fontWeight: 600, fontSize: '1.4rem', marginBottom: '1rem' },
        h6: { fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.8rem' },
        body1: { fontSize: '0.95rem' }, body2: { fontSize: '0.85rem' }, caption: { fontSize: '0.75rem' },
    },
    shape: { borderRadius: 8 },
    components: { // Base component overrides
        // MuiCssBaseline override removed to avoid @import warning
        MuiAppBar: { styleOverrides: { root: ({ theme }) => ({ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: 'none', borderBottom: `1px solid ${theme.palette.divider}` }) } },
        MuiDrawer: { styleOverrides: { paper: ({ theme }) => ({ backgroundColor: theme.palette.background.paper, borderRight: `1px solid ${theme.palette.divider}` }) } },
        MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 500 } }, defaultProps: { disableElevation: true } },
        MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none'}, outlined: ({ theme }) => ({ borderColor: theme.palette.divider }) } },
        MuiCard: { styleOverrides: { root: ({ theme }) => ({ borderRadius: 12, border: `1px solid ${theme.palette.divider}` }) }, defaultProps: { elevation: 0 } },
        MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 500, padding: '2px 4px' } } },
        MuiTableCell: { styleOverrides: { head: ({ theme }) => ({ fontWeight: 600, color: theme.palette.text.secondary, backgroundColor: theme.palette.mode === 'light' ? '#f7f9fc' : theme.palette.background.paper, borderBottom: `2px solid ${theme.palette.divider}`, padding: '12px 16px' }), body: ({ theme }) => ({ padding: '10px 16px', borderBottom: `1px solid ${theme.palette.divider}` }) } },
        MuiTableRow: { styleOverrides: { root: { '&:hover': { backgroundColor: 'action.hover' } } } },
        MuiTooltip: { styleOverrides: { tooltip: { fontSize: '0.8rem' } }, defaultProps: { arrow: true } },
        MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
        MuiInputLabel: { styleOverrides: { root: { fontSize: '0.9rem' } } },
        MuiOutlinedInput: { styleOverrides: { root: ({ theme }) => ({ backgroundColor: theme.palette.background.paper }), notchedOutline: ({ theme }) => ({ borderColor: theme.palette.divider }) } }
    }
};

// --- Function to create theme based on mode ---
export const getAppTheme = (mode) => {
    const modePalette = mode === 'dark' ? darkPalette : lightPalette;
    const theme = createTheme({
        ...baseThemeOptions,
        palette: { mode: mode, ...modePalette },
        // Add mode-specific component overrides if needed
        components: {
            ...baseThemeOptions.components,
            MuiChip: {
                 styleOverrides: {
                     root: ({ ownerState, theme }) => {
                         const { color } = ownerState;
                         let styles = { ...baseThemeOptions.components.MuiChip.styleOverrides.root };
                         const customColorKey = `status_${color}`;
                         if (color && theme.palette[customColorKey]) {
                             styles.backgroundColor = theme.palette[customColorKey].main;
                             styles.color = theme.palette[customColorKey].contrastText;
                         } else if (color && color !== 'default' && theme.palette[color]) {
                             if (theme.palette[color].contrastText) { styles.color = theme.palette[color].contrastText; }
                         } else {
                            styles.backgroundColor = theme.palette.action.selected;
                            styles.color = theme.palette.text.secondary;
                         }
                         return styles;
                     },
                 },
            },
             MuiPaper: {
                ...baseThemeOptions.components.MuiPaper,
                 styleOverrides: {
                    ...baseThemeOptions.components.MuiPaper.styleOverrides,
                     elevation1: ({ theme }) => (theme.palette.mode === 'dark' ? { boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)' } : { boxShadow: '0px 2px 8px rgba(90, 113, 132, 0.1)' } )
                 }
             }
        }
    });
    return theme;
};