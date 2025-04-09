// frontend/src/pages/LandingPage.jsx (or .js)
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Grid, Paper, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Link as MuiLink, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Use RouterLink for internal navigation

// Import some example icons (replace with more appropriate ones later)
import SummarizeIcon from '@mui/icons-material/Summarize';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import RouteIcon from '@mui/icons-material/Route';
import RecommendIcon from '@mui/icons-material/Recommend';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';

// --- Reusable Feature Card Component ---
function FeatureCard({ icon, title, description, features = [] }) {
    return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, borderColor: 'divider' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 1.5, color: 'primary.main' }}>
                        {icon}
                    </Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {description}
                </Typography>
                <List dense disablePadding>
                    {features.map((feature, index) => (
                        <ListItem key={index} disableGutters sx={{py: 0.25}}>
                            <ListItemIcon sx={{ minWidth: 'auto', mr: 1, color: 'success.main' }}>
                                <CheckCircleOutlineIcon sx={{fontSize: '1rem'}}/>
                            </ListItemIcon>
                            <ListItemText primary={feature} primaryTypographyProps={{ variant: 'body2' }}/>
                        </ListItem>
                    ))}
                </List>
            </CardContent>
            {/* Optional: Add the small flow diagram section later */}
        </Card>
    );
}
// --- End Feature Card ---


function LandingPage() {
    const navigate = useNavigate();

    // Data for feature cards (based on image and our agents)
    const agentFeatures = [
        { icon: <SummarizeIcon />, title: "Summarizer Agent", description: "Automatically generates concise summaries of customer conversations, eliminating the need for manual review.", features: ["Extracts relevant facts and tone", "Handles multilingual input", "Keeps agents focused on resolution"] },
        { icon: <PlaylistPlayIcon />, title: "Action Extractor Agent", description: "Detects tasks like follow-ups, escalations, or checks and instantly converts them into actionable items.", features: ["Detects implicit & explicit actions", "Suggests specific troubleshooting steps", "Integrates with task managers (future)"] },
        { icon: <RouteIcon />, title: "Routing Agent", description: "Uses contextual AI and past data to route tasks to the most suitable team or agent, reducing wait times.", features: ["Team-level routing logic", "Considers agent skill & workload (future)", "Integrates with ticketing platforms (future)"] },
        { icon: <RecommendIcon />, title: "Recommendation Engine", description: "Recommends resolutions from historical tickets and help docs using semantic search + AI matching.", features: ["Learns continuously from cases", "Suggests knowledge base articles", "Improves over time with feedback"] },
         { icon: <TimerIcon />, title: "Resolution Time Estimator", description: "Predicts the time needed to resolve a ticket based on complexity, historical data, and workload.", features: ["Helps prioritize critical tickets", "Informs customers and teams", "Reduces SLA breaches (future)"] },
         // Add more cards if needed
    ];


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

            {/* --- Header/Navbar --- */}
            <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        {/* Replace with actual Logo component/image later */}
                        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
                            AI Support System
                        </Typography>
                        {/* Basic Nav Links */}
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, mr: 2 }}>
                            <MuiLink component={RouterLink} to="/" color="inherit" underline="hover">Home</MuiLink>
                            {/* Add more links like Features, Contact later */}
                            <MuiLink href="#features" color="inherit" underline="hover">Features</MuiLink>
                        </Box>
                        <Button variant="contained" onClick={() => navigate('/login')}>
                            Login / Sign Up
                        </Button>
                        {/* Or separate buttons: */}
                        {/* <Button variant="outlined" sx={{ mr: 1 }} onClick={() => navigate('/login')}>Login</Button> */}
                        {/* <Button variant="contained" onClick={() => navigate('/register')}>Sign Up</Button> */}
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1 }}>

                {/* --- Hero Section --- */}
                <Box sx={{ bgcolor: 'background.paper', py: { xs: 6, md: 10 }, textAlign: 'center' }}>
                    <Container maxWidth="md">
                        <Typography component="h1" variant="h2" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                            Our AI Agents at Your Service
                        </Typography>
                        <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
                            Discover how our specialized AI agents work together to revolutionize your customer support experience and streamline operations.
                        </Typography>
                        <Button variant="contained" size="large" onClick={() => navigate('/register')}>
                            Get Started
                        </Button>
                         {/* Or link to login: <Button variant="outlined" size="large" sx={{ml: 2}} onClick={() => navigate('/login')}> Login </Button> */}
                    </Container>
                </Box>

                {/* --- Features Section --- */}
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }} id="features">
                     <Typography component="h2" variant="h4" textAlign="center" sx={{ mb: 6, fontWeight: 'bold' }}>
                        Meet the Agents
                    </Typography>
                    <Grid container spacing={4} justifyContent="center">
                        {agentFeatures.map((item) => (
                            <Grid item key={item.title} xs={12} sm={6} md={4} lg={3}> {/* Adjust grid sizing */}
                                <FeatureCard
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                    features={item.features}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Container>

            </Box> {/* End Main Content */}


            {/* --- Footer --- */}
            <Box component="footer" sx={{ bgcolor: 'grey.900', color: 'grey.400', py: 6, mt: 'auto' }}> {/* mt: auto pushes footer down */}
                <Container maxWidth="lg">
                    <Grid container spacing={4} justifyContent="space-between">
                        <Grid item xs={12} sm={4}>
                            <Typography variant="h6" color="common.white" gutterBottom>AI Support System</Typography>
                            <Typography variant="body2">Revolutionizing customer support with AI-driven automation.</Typography>
                             <Box sx={{ mt: 1 }}>
                                 <IconButton href="#" color="inherit"><TwitterIcon /></IconButton>
                                 <IconButton href="#" color="inherit"><FacebookIcon /></IconButton>
                                 <IconButton href="#" color="inherit"><LinkedInIcon /></IconButton>
                                 <IconButton href="#" color="inherit"><InstagramIcon /></IconButton>
                             </Box>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant="subtitle1" color="common.white" gutterBottom>Quick Links</Typography>
                            <MuiLink component={RouterLink} to="/" color="inherit" display="block" underline="hover" variant="body2" sx={{mb: 0.5}}>Home</MuiLink>
                            <MuiLink href="#features" color="inherit" display="block" underline="hover" variant="body2" sx={{mb: 0.5}}>Features</MuiLink>
                            {/* Add other links */}
                        </Grid>
                         <Grid item xs={6} sm={3}>
                            <Typography variant="subtitle1" color="common.white" gutterBottom>Contact Us</Typography>
                            <Typography variant="body2" sx={{mb: 0.5}}>katiyarh76@gmail.com</Typography>
                            <Typography variant="body2">+91 9216328056</Typography>
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'grey.800', textAlign: 'center' }}>
                        <Typography variant="body2">© {new Date().getFullYear()} AI Support System. All rights reserved.</Typography>
                        <MuiLink component={RouterLink} to="/privacy" color="inherit" variant="body2" sx={{ ml: 2 }}>Privacy Policy</MuiLink>
                        <MuiLink component={RouterLink} to="/terms" color="inherit" variant="body2" sx={{ ml: 2 }}>Terms of Service</MuiLink>
                    </Box>
                </Container>
            </Box> {/* End Footer */}

        </Box> // End Main Flex Container
    );
}

export default LandingPage;