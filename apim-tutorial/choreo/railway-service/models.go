package main

type Train struct {
	ID          int
	Name        string
	Departure   string
	Destination string
	Capacity    int
	Type        string
	Price       int
}

type Booking struct {
	Train  string
	Amount int
}

type Reservation struct {
	ID     string
	Train  Train
	Amount int
	Cost   int
}
