// frontend/src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import theme from './theme.js'; // Import our specific theme
import Sidebar from './components/Sidebar.js';
import Header from './components/Header.js';
import DashboardPage from './pages/DashboardPage.js';
import TicketManagementPage from './pages/TicketManagementPage.js';

const drawerWidth = 240; // Define sidebar width

// Extracted content component to easily use theme hooks
function AppContent() {
  const muiTheme = useTheme(); // Access theme for breakpoints
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm')); // Check if mobile size

  // State for mobile drawer toggle
  const [mobileOpen, setMobileOpen] = useState(false);
  // State for persistent desktop sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
     setIsSidebarOpen(!isSidebarOpen);
     // Close mobile drawer if open when toggling desktop sidebar
     if(mobileOpen) setMobileOpen(false);
  };

  // Adjust main content based on sidebar state (only for desktop)
  const mainContentStyle = {
    flexGrow: 1,
    p: 3, // Padding
    // Adjust width and margin based on sidebar visibility *and* screen size
    width: { sm: `calc(100% - ${isSidebarOpen && !isMobile ? drawerWidth : 0}px)` },
    ml: { sm: `${isSidebarOpen && !isMobile ? drawerWidth : 0}px` },
    transition: muiTheme.transitions.create(['margin', 'width'], {
      easing: muiTheme.transitions.easing.sharp,
      // Use different durations for enter/leave for smoother feel
      duration: isSidebarOpen ? muiTheme.transitions.duration.enteringScreen : muiTheme.transitions.duration.leavingScreen,
    }),
  };

  return (
    <Router>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}> {/* Ensure box takes full height */}
        <Header
          onDrawerToggle={handleDrawerToggle} // Pass mobile toggle handler
          onSidebarToggle={handleSidebarToggle} // Pass desktop toggle handler
          isSidebarOpen={isSidebarOpen}
          drawerWidth={drawerWidth}
        />
        <Sidebar
          drawerWidth={drawerWidth}
          mobileOpen={mobileOpen}
          onDrawerToggle={handleDrawerToggle} // Pass mobile toggle handler
          isDesktopSidebarOpen={isSidebarOpen} // Pass desktop state
        />
        {/* Main Content Area */}
        <Box component="main" sx={mainContentStyle} >
          <Toolbar /> {/* Necessary height spacer for content below AppBar */}
          {/* Add Routes */}
          <Routes>
            {/* Default route redirects to dashboard */}
            <Route path="/" element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tickets" element={<TicketManagementPage />} />
            {/* Add other routes later */}
            {/* <Route path="/reports" element={<ReportsPage />} /> */}
            {/* <Route path="/settings" element={<SettingsPage />} /> */}
            {/* Fallback route */}
            <Route path="*" element={<Navigate replace to="/dashboard" />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

// Main App component applies ThemeProvider and CssBaseline
function App() {
   // ThemeProvider is now applied in main.jsx, no need here
   // if theme was globally configured there.
   // However, keeping it here allows App to potentially override/extend theme later if needed.
   // For simplicity now, main.jsx handles the global theme.
   return <AppContent />; // Render the content directly
}

export default App; // Export the main App component