// frontend/src/components/Header.js
import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, useTheme } from '@mui/material'; // Added useTheme
import MenuIcon from '@mui/icons-material/Menu';

// Basic Header structure
function Header({ onDrawerToggle, onSidebarToggle, isSidebarOpen, drawerWidth }) {
    const theme = useTheme(); // Access theme for transitions

    return (
        <AppBar
            position="fixed" // Keep AppBar fixed
            sx={{
              // Adjust width and margin based on sidebar state for desktop
              width: { sm: `calc(100% - ${isSidebarOpen ? drawerWidth : 0}px)` },
              ml: { sm: `${isSidebarOpen ? drawerWidth : 0}px` },
               // Apply transitions
               transition: theme.transitions.create(['margin', 'width'], {
                    easing: theme.transitions.easing.sharp,
                    duration: isSidebarOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
                }),
               zIndex: (theme) => theme.zIndex.drawer + 1, // Ensure AppBar is above the drawer
            }}
            // color="inherit" // Use if you want theme background, otherwise default 'primary'
            // elevation={1} // Use theme default or override if needed
        >
            <Toolbar>
                {/* Mobile Toggle Button */}
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }} // Only show on mobile
                >
                    <MenuIcon />
                </IconButton>
                 {/* Desktop Toggle Button */}
                 <IconButton
                    color="inherit"
                    aria-label="toggle sidebar"
                    edge="start"
                    onClick={onSidebarToggle} // Use the desktop sidebar toggle handler
                    sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }} // Only show on desktop+
                 >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    AI Support System
                </Typography>
                 {/* Placeholder for future icons */}
                 {/* <Box sx={{ flexGrow: 1 }} /> */}
                 {/* <IconButton color="inherit">...</IconButton> */}
                 {/* <IconButton color="inherit">...</IconButton> */}
            </Toolbar>
        </AppBar>
    );
}

export default Header;