// frontend/src/App.jsx (or .js)
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
// Import ThemeProvider, CssBaseline, and Typography from MUI
import { Box, Toolbar, useTheme, useMediaQuery, CircularProgress, CssBaseline, ThemeProvider, Typography } from '@mui/material';
// Import our theme generating function
import { getAppTheme } from './theme.js';
// Import components and pages (adjust extensions if needed)
import Sidebar from './components/Sidebar.js';
import Header from './components/Header.js';
import DashboardPage from './pages/DashboardPage.js';
import TicketManagementPage from './pages/TicketManagementPage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import CreateTicketPage from './pages/CreateTicketPage.js';
import LandingPage from './pages/LandingPage.js';
// Import authentication context hook
import { useAuth } from './context/AuthContext.js';

const drawerWidth = 240;

// --- Protected Layout Component ---
function ProtectedLayout({ toggleColorMode }) {
    const muiTheme = useTheme(); const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false); const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout } = useAuth();
    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleSidebarToggle = () => { setIsSidebarOpen(!isSidebarOpen); if(mobileOpen) setMobileOpen(false); };
    const mainContentStyle = { flexGrow: 1, p: { xs: muiTheme.spacing(2), sm: muiTheme.spacing(3) }, width: { sm: `calc(100% - ${isSidebarOpen && !isMobile ? drawerWidth : 0}px)` }, ml: { sm: `${isSidebarOpen && !isMobile ? drawerWidth : 0}px` }, transition: muiTheme.transitions.create(['margin', 'width'], { easing: muiTheme.transitions.easing.sharp, duration: isSidebarOpen ? muiTheme.transitions.duration.enteringScreen : muiTheme.transitions.duration.leavingScreen, }), minHeight: `calc(100vh - ${muiTheme.mixins.toolbar.minHeight}px)`, boxSizing: 'border-box', };
    return (
         <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* CssBaseline is now applied by ThemeProvider in App */}
            <Header onDrawerToggle={handleDrawerToggle} onSidebarToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} drawerWidth={drawerWidth} onLogout={logout} toggleColorMode={toggleColorMode} />
            <Sidebar drawerWidth={drawerWidth} mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} isDesktopSidebarOpen={isSidebarOpen} />
            <Box component="main" sx={mainContentStyle} >
              <Toolbar /> <Outlet />
            </Box>
          </Box>
    );
}

// --- RequireAuth Component ---
function RequireAuth({ children }) {
    const { authToken, isLoading } = useAuth(); const location = useLocation();
    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}><CircularProgress /></Box>; }
    if (!authToken) { return <Navigate to="/login" state={{ from: location }} replace />; }
    return children;
}

// --- Main App Component ---
function App() {
    const [mode, setMode] = useState(() => { const savedMode = localStorage.getItem('appThemeMode'); return savedMode === 'dark' ? 'dark' : 'light'; });
    const activeTheme = useMemo(() => getAppTheme(mode), [mode]);
    const toggleColorMode = useCallback(() => { setMode((prevMode) => { const newMode = prevMode === 'light' ? 'dark' : 'light'; localStorage.setItem('appThemeMode', newMode); return newMode; }); }, []);
    const { isLoading: isAuthLoading } = useAuth();

    if (isAuthLoading) {
         return ( <ThemeProvider theme={activeTheme}> <CssBaseline /> <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}><CircularProgress /></Box> </ThemeProvider> );
    }

   return (
        <ThemeProvider theme={activeTheme}>
             <CssBaseline /> {/* Apply baseline based on active theme */}
             <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage toggleColorMode={toggleColorMode}/>} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected Routes */}
                    <Route path="/app/*" element={ <RequireAuth> <ProtectedLayout toggleColorMode={toggleColorMode} /> </RequireAuth> } >
                        <Route index element={<Navigate replace to="/app/dashboard" />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="tickets" element={<TicketManagementPage />} />
                        <Route path="create-ticket" element={<CreateTicketPage />} />
                        {/* Use Typography for nested fallback */}
                        <Route path="*" element={<Typography sx={{p:3}}>App Section Not Found</Typography>} />
                    </Route>

                    {/* Use Typography for top-level fallback */}
                    <Route path="*" element={<Typography sx={{p:3}}>Page Not Found</Typography>} />

                </Routes>
            </Router>
        </ThemeProvider>
   );
}

export default App;