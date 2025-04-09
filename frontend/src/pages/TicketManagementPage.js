// frontend/src/pages/TicketManagementPage.jsx (or .js)
import React, { useState, useEffect, useCallback } from 'react';
// Added Stack for filter layout
import { Box, Typography, Paper, TextField, Button, Select, MenuItem, InputLabel, FormControl, Grid, CircularProgress, Stack, Divider, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TicketList from '../components/TicketList.js'; // Use .js or .jsx
import { getTickets } from '../services/api.js';
// import debounce from 'lodash.debounce'; // Keep commented unless needed

function TicketManagementPage() {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: 'All', priority: 'All' });
    // Separate state for filters actively applied to the API call
    const [activeFilters, setActiveFilters] = useState(filters);

    // Function to load tickets, memoized with useCallback
    const loadTickets = useCallback(async () => {
        setIsLoading(true); setError(null);
        console.log("Loading tickets with filters:", activeFilters);

        const params = {}; // Build params for API
        if (activeFilters.status !== 'All') params.status = activeFilters.status;
        // TODO: Add search/priority params when backend supports
        // if (activeFilters.search) params.search = activeFilters.search;
        // if (activeFilters.priority !== 'All') params.priority = activeFilters.priority;

        try {
            const response = await getTickets(params); // Call API
            setTickets(response.data || []);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            setError(err?.message || "Failed to load tickets. Check backend connection.");
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeFilters]); // Re-run only when activeFilters change

    // useEffect to load tickets on mount and when activeFilters change
    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Update intermediate filter state
    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        // Apply status filter immediately for better UX
        if (name === 'status') {
             setActiveFilters(prev => ({ ...prev, status: value }));
        }
    };

    // Function to apply potentially debounced/manual filters
    const applyFilters = () => {
         if (JSON.stringify(filters) !== JSON.stringify(activeFilters)) {
              console.log("Applying filters:", filters);
              setActiveFilters(filters); // Trigger reload via useEffect dependency
         }
    };

    // Handle Enter key in search box
    const handleSearchKeyDown = (event) => { if (event.key === 'Enter') { applyFilters(); } };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Manage Support Tickets
            </Typography>

            {/* Filter Bar using Paper and Stack */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }} // Stack vertically on small, row on medium+
                    spacing={2} // Space between items
                    alignItems="center" // Align items vertically center in row layout
                >
                    <TextField
                        label="Search ID, Subject, Customer..."
                        variant="outlined"
                        size="small"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        onKeyDown={handleSearchKeyDown}
                        sx={{ flexGrow: 1, minWidth: { sm: '250px' } }} // Allow search to grow
                        InputProps={{ startAdornment: (<SearchIcon sx={{ color: 'action.active', mr: 1 }} />) }}
                        disabled // TODO: Enable when backend supports search
                        placeholder="(Search Not Implemented)"
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select labelId="status-filter-label" label="Status" name="status" value={filters.status} onChange={handleFilterChange} >
                            <MenuItem value="All">All Statuses</MenuItem>
                            <MenuItem value="Open">Open</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Resolved">Resolved</MenuItem>
                            <MenuItem value="Closed">Closed</MenuItem>
                            <MenuItem value="Escalated">Escalated</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }} disabled> {/* Keep disabled */}
                        <InputLabel id="priority-filter-label">Priority</InputLabel>
                        <Select labelId="priority-filter-label" label="Priority" name="priority" value={filters.priority} onChange={handleFilterChange} >
                            <MenuItem value="All">All Priorities</MenuItem>
                            <MenuItem value="Low">Low</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Urgent">Urgent</MenuItem>
                        </Select>
                    </FormControl>
                     {/* Add Apply button if search/priority become manual */}
                     {/* <Button variant="outlined" startIcon={<FilterListIcon />} onClick={applyFilters} sx={{height: 40}} disabled> Apply </Button> */}
                </Stack>
            </Paper>

            {/* Display error if ticket loading fails */}
            {error && !isLoading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Ticket List Component handles its own loading/error/empty states now */}
            <TicketList
                tickets={tickets}
                isLoading={isLoading}
                error={error} // Pass error state down (TicketList can decide to show its own message)
                reloadTickets={loadTickets} // Pass reload function
            />
        </Box>
    );
}

export default TicketManagementPage;