// frontend/src/components/TicketList.js (or .jsx)
import React, { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography, Box, CircularProgress } from '@mui/material';
import TicketItem from './TicketItem.js'; // Use .js or .jsx

function TicketList({ tickets, isLoading, error, reloadTickets }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => { setPage(newPage); window.scrollTo(0, 0); };
    const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

    const paginatedTickets = Array.isArray(tickets) ? tickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];

    // Display Loading or Error State provided by parent
    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>; }
    // Error is displayed by parent now
    // if (error) { return <Typography color="error" sx={{ m: 2 }}>Error loading tickets: {error}</Typography>; }
    if (!isLoading && (!tickets || tickets.length === 0)) { // Check isLoading is false before showing no tickets
        return <Typography sx={{mt: 3, textAlign: 'center'}}>No tickets found matching your criteria.</Typography>;
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
            <TableContainer sx={{ maxHeight: 650 }}>
                <Table stickyHeader aria-label="tickets table">
                    <TableHead>
                        <TableRow>
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
                            <TicketItem key={ticket.id} ticket={ticket} reloadTickets={reloadTickets} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={tickets.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}
export default TicketList;