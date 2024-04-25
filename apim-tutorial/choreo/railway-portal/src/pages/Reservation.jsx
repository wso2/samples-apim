import React from "react";
import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Divider from "@mui/material/Divider";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import trainFenceLogo from '../assets/train-fence.svg';
import { deleteReservation } from "../api/api";

import { getReservations } from '../api/api';

export default function Reservation() {
    const [reservations, setReservations] = useState([]);

    const handleDelete = (id) => {
        deleteReservation(id).then((response) => {
            getReservations().then((response1) => {
                setReservations(response1);
            })
            console.log(response);
        }).catch((error) => {
            console.error(error);
        });
    }

    useEffect(() => {
        getReservations().then((response) => {
            setReservations(response);
        }).catch((error) => {
            console.error(error)});
    }, []);
    return (
        <div>
            <h1>Reservations</h1>
            {reservations.length != 0 && (
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-evenly"
                    alignItems="center"
                    gap={2}
                >
                    {reservations.map((reservation) => (
                        <Card key={reservation.ID}>
                            <CardContent>
                                <Box
                                    display="flex"
                                    flexDirection="row"
                                    justifyContent="space-evenly"
                                    alignItems="center"
                                    gap={2}
                                    width={1000}
                                >
                                    <Typography sx={{ fontSize: 15 }} color="text.primary" gutterBottom>
                                        Reference: {reservation.ID}
                                    </Typography>
                                    <Divider orientation="vertical" flexItem />
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        justifyContent="space-evenly"
                                        alignItems="center"
                                        gap={2}
                                    >
                                        <Typography sx={{ fontSize: 15 }} color="text.primary" gutterBottom>
                                            {reservation.Train.Name}
                                        </Typography>
                                        <Box
                                            display="flex"
                                            flexDirection="row"
                                            justifyContent="space-evenly"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            <Typography sx={{ fontSize: 15 }} color="text.secondary" gutterBottom>
                                                {reservation.Train.Departure}
                                            </Typography>
                                            <ChevronRightIcon />
                                            <Typography sx={{ fontSize: 15 }} color="text.secondary" gutterBottom>
                                                {reservation.Train.Destination}
                                            </Typography>
                                        </Box>

                                    </Box>
                                    <Divider orientation="vertical" flexItem />
                                    <Chip label={reservation.Train.Type} variant="outlined" color="primary" />
                                    <Divider orientation="vertical" flexItem />
                                    <Typography sx={{ fontSize: 15 }} color="text.primary" gutterBottom>
                                        Tickets: {reservation.Amount}
                                    </Typography>
                                    <Divider orientation="vertical" flexItem />
                                    <Typography sx={{ fontSize: 15 }} color="text.primary" gutterBottom>
                                        £{reservation.Cost}
                                    </Typography>
                                    <Divider orientation="vertical" flexItem />
                                    <IconButton onClick={() => handleDelete(reservation.ID)}>
                                        <DeleteIcon 
                                            className="delete-icon"
                                        />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
            {reservations.length == 0 && (
                <Box>
                    <a href="/add-booking" target="_blank">
                        <img src={trainFenceLogo} className="logo" />
                    </a>
                    <Typography variant="h6" gutterBottom>
                        No reservations found.
                    </Typography>
                </Box>
                
            )}
        </div>
    );
}
