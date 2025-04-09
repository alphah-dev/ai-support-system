// frontend/src/components/Sidebar.js (or .jsx)
import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider } from '@mui/material';
// Import Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// Import RouterLink for navigation
import { Link as RouterLink, useLocation } from 'react-router-dom';

// Define menu items with text, icon, and route path including /app prefix
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/app/dashboard' },       // <<< UPDATED PATH
  { text: 'Tickets', icon: <ConfirmationNumberIcon />, path: '/app/tickets' }, // <<< UPDATED PATH
  { text: 'Create Ticket', icon: <AddCircleOutlineIcon />, path: '/app/create-ticket' }, // <<< UPDATED PATH
  // Add more items later (e.g., /app/reports, /app/settings)
];

function Sidebar({ drawerWidth, mobileOpen, onDrawerToggle, isDesktopSidebarOpen }) {
   const location = useLocation(); // Hook to get current route

   // Content of the drawer
   const drawerContent = (
     <Box sx={{ overflow: 'auto' }}>
       <Toolbar /> {/* Spacer */}
       <List>
         {menuItems.map((item) => (
           <ListItem key={item.text} disablePadding>
             <ListItemButton
                component={RouterLink}
                to={item.path} // Use the updated path
                // Update selection logic to check based on potentially nested routes
                selected={location.pathname.startsWith(item.path)}
                sx={{
                    py: 1.25,
                    '&.Mui-selected': { backgroundColor: 'action.selected', '&:hover': { backgroundColor: 'action.hover', }, },
               }}
             >
               <ListItemIcon sx={{ minWidth: 'auto', mr: 2, color: 'inherit' }}>
                   {item.icon}
               </ListItemIcon>
               <ListItemText primary={item.text} />
             </ListItemButton>
           </ListItem>
         ))}
       </List>
     </Box>
   );

   // Render mobile and desktop drawers (no changes needed here)
   return (
     <Box component="nav" sx={{ width: { sm: isDesktopSidebarOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }} aria-label="main navigation" >
       <Drawer variant="temporary" open={mobileOpen} onClose={onDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }, }} > {drawerContent} </Drawer>
       <Drawer variant="persistent" open={isDesktopSidebarOpen} sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, }, }} > {drawerContent} </Drawer>
     </Box>
   );
}

export default Sidebar;