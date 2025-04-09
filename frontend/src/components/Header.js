// frontend/src/components/Header.jsx (or .js)
import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, useTheme, Box, Menu, MenuItem, Tooltip, ListItemIcon } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function Header({ onDrawerToggle, onSidebarToggle, isSidebarOpen, drawerWidth, onLogout, toggleColorMode }) {
    const theme = useTheme();
    const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState(null);
    const accountMenuOpen = Boolean(accountMenuAnchorEl);
    const handleAccountMenuOpen = (event) => { setAccountMenuAnchorEl(event.currentTarget); };
    const handleAccountMenuClose = () => { setAccountMenuAnchorEl(null); };
    const handleLogoutClick = () => { handleAccountMenuClose(); if (onLogout) onLogout(); };

    return (
        <AppBar position="fixed" elevation={0} sx={{ width: { sm: `calc(100% - ${isSidebarOpen ? drawerWidth : 0}px)` }, ml: { sm: `${isSidebarOpen ? drawerWidth : 0}px` }, transition: theme.transitions.create(['margin', 'width'], { easing: theme.transitions.easing.sharp, duration: isSidebarOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen, }), zIndex: (theme) => theme.zIndex.drawer + 1, }} >
            <Toolbar>
                 <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={onDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }} > <MenuIcon /> </IconButton>
                 <IconButton color="inherit" aria-label="toggle sidebar" edge="start" onClick={onSidebarToggle} sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }} > <MenuIcon /> </IconButton>
                 <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}> AI Support System </Typography>

                {/* Theme Toggle Button */}
                <Tooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}>
                    {toggleColorMode && ( <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit"> {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />} </IconButton> )}
                </Tooltip>

                {/* Account Button & Menu */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    <Tooltip title="Account options"> <IconButton size="large" edge="end" aria-label="account of current user" aria-controls={accountMenuOpen ? 'account-menu' : undefined} aria-haspopup="true" onClick={handleAccountMenuOpen} color="inherit" > <AccountCircleIcon /> </IconButton> </Tooltip>
                    <Menu id="account-menu" anchorEl={accountMenuAnchorEl} open={accountMenuOpen} onClose={handleAccountMenuClose} MenuListProps={{ 'aria-labelledby': 'account-button' }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 1 }} >
                        <MenuItem onClick={handleLogoutClick}> <ListItemIcon> <LogoutIcon fontSize="small" /> </ListItemIcon> Logout </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
export default Header;