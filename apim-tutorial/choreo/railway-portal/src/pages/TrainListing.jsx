import { Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { CardActionArea } from '@mui/material';
import Divider from "@mui/material/Divider";
import { Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useEffect, useState } from 'react';
import { getTrains } from '../api/api';

export default function TrainListing() {
    const [trains, setTrains] = useState([]);

    useEffect(() => {
        getTrains().then((response) => {
            setTrains(response);
        }).catch((error) => {
            console.error(error)});
    },[]);

    return (
        <div>
            <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-evenly"
                alignItems="center"
                mt={2}
                gap={5}
            >
                {trains.map((train) => (
                <Card key={train.ID} sx={{ minWidth: 275 }}>
                    <CardActionArea>
                        <CardContent>
                            <Typography variant="h5" component="div">
                            {train.Name}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                            {train.Type}
                            </Typography>
                            <Box
                                display="flex"
                                flexDirection="row"
                                justifyContent="space-evenly"
                                alignItems="center"
                                mt={2}
                                gap={1}
                            >
                                <Typography sx={{ fontSize: 15 }} color="text.secondary" gutterBottom>
                                {train.Departure}
                                </Typography>
                                <ChevronRightIcon />
                                <Typography sx={{ fontSize: 15 }} color="text.secondary" gutterBottom>
                                {train.Destination}
                                </Typography>
                            </Box>
                            <Divider light />
                            <Box
                                display="flex"
                                flexDirection="row"
                                justifyContent="space-evenly"
                                alignItems="center"
                                mt={2}
                                gap={1}
                            >
                                <Box>
                                    <Typography sx={{ fontSize: 12 }} color="text.secondary" gutterBottom>
                                    Capacity
                                    </Typography>
                                    {train.Capacity}
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: 12 }} color="text.secondary" gutterBottom>
                                    Ticket Price
                                    </Typography>
                                    £{train.Price}
                                </Box>
                            </Box>
                        </CardContent>
                    </CardActionArea>
                </Card>
                ))}
            </Box>
        </div>
    );
}
