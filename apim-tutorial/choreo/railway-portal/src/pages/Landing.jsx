import { Box, Button, Typography } from "@mui/material";
import TrainListing from "./TrainListing";
import trainLogo from "../assets/train.svg";

export default function LandingPage() {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        flexGrow={1}
        gap={5}
        mb={5}
      >
        <div>
            <a href="" target="_blank">
                <img src={trainLogo} className="logo" alt="Train logo" />
            </a>
        </div>
        <Typography
          mt={-12}
          fontSize={75}
          fontWeight={500}
          textAlign="center"
          variant="h1"
        >
          Railway Service
        </Typography>
        <TrainListing />
        <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-evenly"
            alignItems="center"
            mt={2}
            gap={5}
        >
            <Button
                variant="contained"
                color="primary"
                style={{
                    borderRadius: 32,
                    textTransform: "none",
                    height: 64,
                    width: 200,
                    fontSize: 18,
                }}
                onClick={() => window.location.href = "/add-booking"}
            >
                Book a Train
            </Button>
            <Button
                variant="contained"
                color="secondary"
                style={{
                    borderRadius: 32,
                    textTransform: "none",
                    height: 64,
                    width: 200,
                    fontSize: 18,
                }}
                onClick={() => window.location.href = "/view-bookings"}
            >
                View Reservations
            </Button>
        </Box>
      </Box>
    );
}