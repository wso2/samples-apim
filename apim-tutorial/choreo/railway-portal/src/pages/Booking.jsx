import React from 'react';
import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useState } from 'react';
import ticketLogo from '../assets/train-ticket.svg';
import { addBooking } from '../api/api';
import { BookingPayload } from '../api/models';

const trains = [
    {
        value: 'Orient Express',
        label: 'Orient Express',
    },
    {
        value: 'Manchester Bullet',
        label: 'Manchester Bullet',
    },
    {
        value: 'Queens Passage',
        label: 'Queens Passage',
    },
];

export default function Booking() {
    const [train, setTrain] = useState('');
    const [tickets, setTickets] = useState(0);
    const [bookingAdded, setBookingAdded] = useState(false);

    const bookTickets = () => {
        const payload = new BookingPayload(train, tickets);
        console.log(payload.train);
        addBooking(payload).then((response) => {
            setBookingAdded(true);
            console.log(response);
        }).catch((error) => {
            console.error(error);
        });
    };

    const handleAlertClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setBookingAdded(false);
    }
    
    return(
        <Box m="10%">
            <Card>
                <CardContent>
                    <Typography variant="h4" component="div">
                        Book a Train
                    </Typography>
                    <img src={ticketLogo} className="ticket" alt="Ticket" />
                    <Box
                        component="form"
                        sx={{
                            '& .MuiTextField-root': { m: 1, width: '40ch' },
                            }}
                        noValidate
                        autoComplete="off"
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        gap={2}
                        mb={4}
                        ml={4}
                        mr={4}
                    >
                        <TextField
                            select
                            label="Select Train"
                            defaultValue=""
                            helperText="Please select the train you want to book"
                            onChange={(e) => setTrain(e.target.value)}
                        >
                            {trains.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Number of Tickets"
                            type="number"
                            helperText="Please enter the number of tickets you want to purchase"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            InputProps={{
                                inputProps: { min: 1 },
                            }}
                            onChange={(e) => setTickets(e.target.valueAsNumber)}
                        />
                        <Button
                            variant="contained"
                            color="secondary"
                            style={{
                                borderRadius: 32,
                                textTransform: "none",
                                height: 64,
                                width: 175,
                                fontSize: 18,
                            }}
                            onClick={bookTickets}
                            disabled={train === '' || tickets === 0}
                        >
                            Book Tickets
                        </Button>
                        <Snackbar
                            open={bookingAdded}
                            onClose={handleAlertClose}
                            autoHideDuration={4000}
                        >
                            <Alert
                                severity="success"
                                variant="filled"
                                sx={{ width: '100%' }}
                            >
                                Booking added successfully!
                            </Alert>
                        </Snackbar>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
};
