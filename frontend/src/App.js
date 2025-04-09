// frontend/src/App.jsx (or .js)
import React, { useState, useMemo, useCallback, useEffect } from 'react';
// Import necessary components from react-router-dom
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
// Import necessary MUI components
import { Box, Toolbar, useTheme, useMediaQuery, CircularProgress, CssBaseline, ThemeProvider, Typography } from '@mui/material';
// Import our theme generating function
import { getAppTheme } from './theme.js';
// Import custom components and pages (use .js or .jsx consistently)
import Sidebar from './components/Sidebar.js';
import Header from './components/Header.js';
import DashboardPage from './pages/DashboardPage.js';
import TicketManagementPage from './pages/TicketManagementPage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import CreateTicketPage from './pages/CreateTicketPage.js';
import LandingPage from './pages/LandingPage.js';
import TicketDetailPage from './pages/TicketDetailPage.js'; // <<<--- Import TicketDetailPage
// Import authentication context hook
import { useAuth } from './context/AuthContext.js';

// Define constant for drawer width
const drawerWidth = 240;

// --- Protected Layout Component ---
// Renders the main application structure (Header, Sidebar, Content Area)
function ProtectedLayout({ toggleColorMode }) { // Pass toggle function
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout } = useAuth();

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleSidebarToggle = () => { setIsSidebarOpen(!isSidebarOpen); if(mobileOpen) setMobileOpen(false); };

    // Dynamic styles for the main content area
    const mainContentStyle = {
        flexGrow: 1,
        p: { xs: muiTheme.spacing(2), sm: muiTheme.spacing(3) },
        width: { sm: `calc(100% - ${isSidebarOpen && !isMobile ? drawerWidth : 0}px)` },
        ml: { sm: `${isSidebarOpen && !isMobile ? drawerWidth : 0}px` },
        transition: muiTheme.transitions.create(['margin', 'width'], { easing: muiTheme.transitions.easing.sharp, duration: isSidebarOpen ? muiTheme.transitions.duration.enteringScreen : muiTheme.transitions.duration.leavingScreen, }),
        minHeight: `calc(100vh - ${muiTheme.mixins.toolbar.minHeight}px)`, // Adjust if AppBar height changes
        boxSizing: 'border-box',
    };

    return (
         <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* CssBaseline is applied globally by ThemeProvider */}
            <Header
                onDrawerToggle={handleDrawerToggle}
                onSidebarToggle={handleSidebarToggle}
                isSidebarOpen={isSidebarOpen}
                drawerWidth={drawerWidth}
                onLogout={logout}
                toggleColorMode={toggleColorMode} // Pass toggle down
            />
            <Sidebar
                drawerWidth={drawerWidth}
                mobileOpen={mobileOpen}
                onDrawerToggle={handleDrawerToggle}
                isDesktopSidebarOpen={isSidebarOpen}
            />
            <Box component="main" sx={mainContentStyle} >
              <Toolbar /> {/* Spacer for AppBar */}
              <Outlet /> {/* Nested child routes render here */}
            </Box>
          </Box>
    );
}

// --- RequireAuth Component ---
// Protects routes that need authentication
function RequireAuth({ children }) {
    const { authToken, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) { // Show loader during initial auth check
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (!authToken) { // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children; // Render protected content
}


// --- Main App Component ---
// Sets up routing structure and manages theme state
function App() {
   // Theme state management
   const [mode, setMode] = useState(() => { const savedMode = localStorage.getItem('appThemeMode'); return savedMode === 'dark' ? 'dark' : 'light'; });
   const activeTheme = useMemo(() => getAppTheme(mode), [mode]);
   const toggleColorMode = useCallback(() => { setMode((prevMode) => { const newMode = prevMode === 'light' ? 'dark' : 'light'; localStorage.setItem('appThemeMode', newMode); return newMode; }); }, []);

   const { isLoading: isAuthLoading } = useAuth(); // Auth loading state

   // Initial App Loader (wrapped in theme)
   if (isAuthLoading) {
        return ( <ThemeProvider theme={activeTheme}> <CssBaseline /> <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}><CircularProgress /></Box> </ThemeProvider> );
   }

   // Render application routes within theme provider
   return (
        <ThemeProvider theme={activeTheme}>
             <CssBaseline />
             <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage toggleColorMode={toggleColorMode}/>} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected Routes (nested under /app prefix) */}
                    <Route
                        path="/app/*" // Matches /app and paths below
                        element={
                            <RequireAuth>
                                <ProtectedLayout toggleColorMode={toggleColorMode} />
                            </RequireAuth>
                        }
                    >
                        {/* Nested routes render inside ProtectedLayout's <Outlet> */}
                        <Route index element={<Navigate replace to="/app/dashboard" />} /> {/* Default /app redirects to dashboard */}
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="tickets" element={<TicketManagementPage />} />
                        {/* <<<--- Route for a single ticket detail page ---<<< */}
                        {/* ':ticketId' becomes a URL parameter */}
                        <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
                        <Route path="create-ticket" element={<CreateTicketPage />} />
                        {/* Fallback within /app */}
                        <Route path="*" element={<Typography sx={{p:3}}>App Section Not Found</Typography>} />
                    </Route>

                    {/* Top-level Fallback */}
                     <Route path="*" element={<Typography sx={{p:3}}>Page Not Found</Typography>} />

                </Routes>
            </Router>
        </ThemeProvider>
   );
}

export default App;