// frontend/src/components/TicketList.js
import React, { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography, Box, CircularProgress } from '@mui/material';
import TicketItem from './TicketItem.js'; // Import the item component (create next)

function TicketList({ tickets, isLoading, error, reloadTickets }) { // Receive tickets, loading state, error, and reload function
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10); // Or 5, 25 etc.

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        // Optional: Scroll to top when changing page
        window.scrollTo(0, 0);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when changing rows per page
    };

    // Calculate tickets for the current page - Slice the tickets array
    // Handle cases where tickets might be null or not an array yet during loading/error
    const paginatedTickets = Array.isArray(tickets)
        ? tickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : [];

    // Display Loading or Error State
    if (isLoading) {
       return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }
    if (error) {
       return <Typography color="error" sx={{ m: 2 }}>Error loading tickets: {error}</Typography>;
    }
    if (!tickets || tickets.length === 0) {
        return <Typography sx={{mt: 3, textAlign: 'center'}}>No tickets found matching your criteria.</Typography>;
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}> {/* Add margin top */}
            <TableContainer sx={{ maxHeight: 650 }}> {/* Adjust max height as needed */}
                <Table stickyHeader aria-label="tickets table">
                    <TableHead>
                        <TableRow>
                            {/* Define your columns - Adjust as needed */}
                            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTickets.map((ticket) => (
                            // Render TicketItem for each ticket in the current page
                            <TicketItem key={ticket.id} ticket={ticket} reloadTickets={reloadTickets} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]} // Add more options
                component="div"
                count={tickets.length} // Total number of tickets (for pagination calculation)
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}

export default TicketList;