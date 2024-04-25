package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/gofrs/uuid"
	"github.com/rs/cors"
)

var Train1 = Train{
	ID:          1,
	Name:        "Orient Express",
	Departure:   "London",
	Destination: "Liverpool",
	Capacity:    200,
	Type:        "Express",
	Price:       150,
}

var Train2 = Train{
	ID:          2,
	Name:        "Manchester Bullet",
	Departure:   "London",
	Destination: "Manchester",
	Capacity:    175,
	Type:        "Express",
	Price:       125,
}

var Train3 = Train{
	ID:          3,
	Name:        "Queens Passage",
	Departure:   "London",
	Destination: "Glasgow",
	Capacity:    300,
	Type:        "Non-Express",
	Price:       1100,
}

func main() {
	trains := addTrains()
	reservations := []Reservation{}

	mux := http.NewServeMux()
	mux.HandleFunc("/trains", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			json.NewEncoder(w).Encode(trains)
		}
	})

	mux.HandleFunc("/book", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			body, err := io.ReadAll(r.Body)
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			var booking Booking
			err = json.Unmarshal(body, &booking)
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			reservation, intError := addBooking(booking)
			if intError != nil {
				http.Error(w, intError.Error(), http.StatusBadRequest)
				return
			}
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(reservation)
			reservations = append(reservations, reservation)
		}
	})

	mux.HandleFunc("/reservations", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			json.NewEncoder(w).Encode(reservations)
		} else if r.Method == http.MethodDelete {
			id := r.URL.Query().Get("id")
			if id == "" {
				http.Error(w, "ID not found", http.StatusBadRequest)
				return
			}
			for i, reservation := range reservations {
				if reservation.ID == id {
					reservations = append(reservations[:i], reservations[i+1:]...)
					w.WriteHeader(http.StatusOK)
					return
				}
			}
			http.Error(w, "Reservation not found", http.StatusNotFound)
		}
	})

	corsHandler := cors.AllowAll()
	handler := corsHandler.Handler(mux)

	fmt.Println("Server is starting on port 8080...")
	http.ListenAndServe(":8080", handler)
}

func addTrains() []Train {
	trains := []Train{}
	trains = append(trains, Train1, Train2, Train3)

	return trains
}

func addBooking(booking Booking) (Reservation, error) {
	var reservation Reservation
	uuid, _ := uuid.NewV7()
	if booking.Train == "Orient Express" {
		reservation = Reservation{
			ID:     uuid.String(),
			Train:  Train1,
			Amount: booking.Amount,
			Cost:   booking.Amount * Train1.Price,
		}
	} else if booking.Train == "Manchester Bullet" {
		reservation = Reservation{
			ID:     uuid.String(),
			Train:  Train2,
			Amount: booking.Amount,
			Cost:   booking.Amount * Train2.Price,
		}
	} else if booking.Train == "Queens Passage" {
		reservation = Reservation{
			ID:     uuid.String(),
			Train:  Train3,
			Amount: booking.Amount,
			Cost:   booking.Amount * Train3.Price,
		}
	} else {
		return Reservation{}, errors.New("Train not found")
	}

	return reservation, nil
}
