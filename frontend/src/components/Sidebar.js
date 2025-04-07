// frontend/src/components/Sidebar.js
import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Tickets', icon: <ConfirmationNumberIcon />, path: '/tickets' },
  // Add more items like Reports, Settings later
];

function Sidebar({ drawerWidth, mobileOpen, onDrawerToggle, isDesktopSidebarOpen }) {
   const location = useLocation();

   const drawerContent = (
     // Use Box component for content styling if needed
     <Box sx={{ overflow: 'auto' }}> {/* Prevent content overflow issues */}
       <Toolbar /> {/* Necessary spacer to align below AppBar */}
       <List>
         {menuItems.map((item) => (
           <ListItem key={item.text} disablePadding>
             {/* Use ListItemButton for better interaction and styling */}
             <ListItemButton
                component={RouterLink} // Use RouterLink for navigation
                to={item.path}
                selected={location.pathname.startsWith(item.path)} // Highlight active link section
                sx={{ // Styling for selected item
                    '&.Mui-selected': {
                        backgroundColor: 'action.selected', // Use theme's selected color
                        '&:hover': {
                           backgroundColor: 'action.hover', // Use theme's hover color
                        },
                        // Optional: Change icon/text color when selected
                        // '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                        //    color: 'primary.main',
                        // },
                    },
               }}
             >
               <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>{/* Adjust icon margin */}
                   {item.icon}
               </ListItemIcon>
               <ListItemText primary={item.text} />
             </ListItemButton>
           </ListItem>
         ))}
       </List>
     </Box>
   );

   return (
     <Box
       component="nav"
       // Adjust width based on desktop sidebar state
       sx={{ width: { sm: isDesktopSidebarOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
       aria-label="main navigation"
     >
       {/* Mobile Drawer (Temporary) */}
       <Drawer
         variant="temporary"
         open={mobileOpen}
         onClose={onDrawerToggle} // Close on clicking outside or escape key
         ModalProps={{
           keepMounted: true, // Better open performance on mobile.
         }}
         sx={{
           display: { xs: 'block', sm: 'none' }, // Show only on mobile
           '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
         }}
       >
         {drawerContent}
       </Drawer>
       {/* Desktop Drawer (Persistent) */}
       <Drawer
         variant="persistent" // Keeps its space in layout, controlled by open prop
         open={isDesktopSidebarOpen}
         sx={{
           display: { xs: 'none', sm: 'block' }, // Show only on desktop+
           '& .MuiDrawer-paper': {
               boxSizing: 'border-box',
               width: drawerWidth,
               // Position fixed might cause issues with content scroll,
               // let the Box component handle positioning relative to flex container
               // position: 'fixed',
               // height: '100vh',
            },
         }}
       >
         {drawerContent}
       </Drawer>
     </Box>
   );
}

export default Sidebar;