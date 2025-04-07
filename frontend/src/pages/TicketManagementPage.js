// frontend/src/pages/TicketManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, TextField, Button, Select, MenuItem, InputLabel, FormControl, Grid, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TicketList from '../components/TicketList.js'; // Import the list component
import { getTickets } from '../services/api.js'; // Import the API function
import debounce from 'lodash.debounce'; // Import debounce

function TicketManagementPage() {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'All', // Default filter
        priority: 'All',
        // dateRange: null // Add later if needed
    });
    // State to trigger refetch when filters change via button/enter
    const [activeFilters, setActiveFilters] = useState(filters);

    // Function to load tickets from API based on active filters
    const loadTickets = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        console.log("Loading tickets with filters:", activeFilters);

        // Prepare query parameters for the API call
        const params = {};
        if (activeFilters.status && activeFilters.status !== 'All') {
            params.status = activeFilters.status;
        }
        if (activeFilters.priority && activeFilters.priority !== 'All') {
            // TODO: Add priority filtering if backend supports it
            // params.priority = activeFilters.priority;
            console.warn("Priority filtering not implemented yet in API call.");
        }
        if (activeFilters.search) {
             // TODO: Add search filtering if backend supports it
             // params.search = activeFilters.search;
             console.warn("Search filtering not implemented yet in API call.");
        }
        // Add limit/offset later if implementing server-side pagination

        try {
            // Call the API function from api.js
            const response = await getTickets(params);
            setTickets(response.data || []); // Assuming API returns data in response.data
        } catch (err) {
            console.error("Error fetching tickets:", err);
            setError(err?.message || "Failed to load tickets.");
            setTickets([]); // Clear tickets on error
        } finally {
            setIsLoading(false);
        }
    }, [activeFilters]); // Reload when activeFilters change

    // Load tickets on initial mount and whenever activeFilters change
    useEffect(() => {
        loadTickets();
    }, [loadTickets]); // Dependency array includes loadTickets callback

    // --- Filter Handling ---

    // Update intermediate filter state as user types/selects
    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Debounced search input handler (optional: triggers search automatically after typing stops)
    // const debouncedSearch = useCallback(
    //     debounce((searchValue) => {
    //         setActiveFilters(prev => ({ ...prev, search: searchValue }));
    //     }, 500), // 500ms delay
    //     [] // Empty dependency array for useCallback
    // );
    // const handleSearchInputChange = (event) => {
    //     const value = event.target.value;
    //     setFilters(prev => ({ ...prev, search: value }));
    //     debouncedSearch(value);
    // };

    // Handler for explicit search/filter application (button click or Enter key)
    const applyFilters = () => {
         // Only update activeFilters if they have actually changed
         if (JSON.stringify(filters) !== JSON.stringify(activeFilters)) {
              console.log("Applying filters:", filters);
              setActiveFilters(filters); // Trigger reload via useEffect
         }
    };

    const handleSearchKeyDown = (event) => {
        if (event.key === 'Enter') {
            applyFilters();
        }
    };
    // --- End Filter Handling ---


    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Ticket Management
            </Typography>

            {/* Search and Filter Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6} lg={4}>
                       <TextField
                            label="Search Tickets (Not Implemented)" // Update label when implemented
                            variant="outlined"
                            size="small"
                            name="search"
                            fullWidth
                            value={filters.search}
                            onChange={handleFilterChange} // Use direct change handler for now
                            onKeyDown={handleSearchKeyDown}
                            disabled // Disable until backend supports search
                        />
                    </Grid>
                    <Grid item xs={6} md={3} lg={2}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="status-filter-label">Status</InputLabel>
                            <Select
                                labelId="status-filter-label"
                                label="Status"
                                name="status"
                                value={filters.status}
                                onChange={(e) => { handleFilterChange(e); /* Optionally apply immediately: */ setActiveFilters(prev => ({...prev, status: e.target.value})) }}
                            >
                                <MenuItem value="All">All Statuses</MenuItem>
                                <MenuItem value="Open">Open</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Resolved">Resolved</MenuItem>
                                <MenuItem value="Closed">Closed</MenuItem>
                                <MenuItem value="Escalated">Escalated</MenuItem>
                            </Select>
                        </FormControl>
                     </Grid>
                     <Grid item xs={6} md={3} lg={2}>
                        <FormControl size="small" fullWidth disabled> {/* Disable until backend supports */}
                            <InputLabel id="priority-filter-label">Priority</InputLabel>
                            <Select
                                labelId="priority-filter-label"
                                label="Priority"
                                name="priority"
                                value={filters.priority}
                                onChange={handleFilterChange}
                            >
                                <MenuItem value="All">All Priorities</MenuItem>
                                <MenuItem value="Low">Low</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="High">High</MenuItem>
                                <MenuItem value="Urgent">Urgent</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {/* Add Date Range Picker later if needed */}
                    <Grid item xs={12} md={12} lg={2}> {/* Adjust grid sizing */}
                       <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={applyFilters}
                            fullWidth
                            disabled // Disable until search/priority implemented
                       >
                            Apply Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Ticket List - Pass tickets, loading state, error, and reload callback */}
            <TicketList
                tickets={tickets}
                isLoading={isLoading}
                error={error}
                reloadTickets={loadTickets} // Pass function to allow TicketItem to trigger refresh
            />

        </Box>
    );
}

export default TicketManagementPage;