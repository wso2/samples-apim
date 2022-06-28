package org.wso2.reservationsservice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.wso2.reservationsservice.model.Reservation;

import java.util.Random;

@RestController public class ReservationsController {

    String sampleReservationsList = "{\"reservations\":[   \n"
                                    + "        {\"Book Name\":\"Beginning WSO2 ESB\", \"User Name\":\"Joh Murphy\"},    \n"
                                    + "        {\"Book Name\":\"Microservices for the Enterprise\", \"User Name\":\"Jack Kallis\"},\n"
                                    + "        {\"Book Name\":\"Microservices Security in Action\", \"User Name\":\"Dave Colman\"},\n"
                                    + "        {\"Book Name\":\"Beginning Ballerina Programming: From Novice to Professional\", \"Ricky Arthur\":\"Anjana Fernando and Lakmal Warusawithana\"},     \n"
                                    + "        {\"Book Name\":\"API Automation and Scaling\", \"Tom Sawyer\":\"WSO2 Team\"}\n"
                                    + "    ]}";

    String sampleReservation = "{\n" + "  \"bookName\":\"Microservices Security in Action\",\n"
                                    + "   \"userName\":\"Mike Hussain\",\n"
                                    + "   \"reservedDate\":\"5th April, 2021\",\n"
                                    + "   \"reservationDuration\":\"14 days\",\n" + "   \"status\" :\"Active\"\n" + "}";

    @RequestMapping(value = "/", method = RequestMethod.GET) public String index() {
        return "Welcome to Books API";
    }

    @GetMapping("/reservations") public ResponseEntity<?> getBooks() {
        // TODO: Appropriate implementation for HTTP GET request
        System.out.println("GET books invoked");
        return new ResponseEntity<>(sampleReservationsList + "\n", HttpStatus.OK);
    }

    @GetMapping("/reservations/{reservationId}") public ResponseEntity<?> getBookById(
                                    @PathVariable("reservationId") String code) {
        // TODO: Appropriate implementation for HTTP GET request
        System.out.println("GET reservation info by reservationId, invoked");
        return new ResponseEntity<>(sampleReservation + "\n" + code, HttpStatus.OK);
    }

    @PostMapping("/reservations") public ResponseEntity<?> addReservation(@RequestBody Reservation reservation) {
        // TODO: Appropriate implementation for HTTP POST request
        System.out.println("Add reservation invoked");

        //set sample data for the added reservation
        reservation.setReservationId(33);
        reservation.setBookName("Microservices for the Enterprise");
        reservation.setUserName("Tim Pane");
        reservation.setReservedDate("14/05/2021");
        reservation.setStatus("Active");
        return new ResponseEntity<>(reservation, HttpStatus.CREATED);
    }

    @PutMapping("/reservations/{reservationId}") public ResponseEntity<?> put(
                                    @PathVariable("reservationId") String reservationId,
                                    @RequestBody Reservation reservation) {
        // TODO: Appropriate implementation for HTTP PUT request
        System.out.println("PUT reservation invoked");

        //set sample data for the updated reservation
        reservation.setReservationId(Integer.parseInt(reservationId));
        reservation.setBookName("Microservices for the Enterprise");
        reservation.setUserName("Veron Kinsky");
        reservation.setReservedDate("14/05/2021");
        reservation.setStatus("Active");
        return new ResponseEntity<>(reservation, HttpStatus.OK);
    }

    @DeleteMapping("/reservations/{reservationId}") public ResponseEntity<?> delete(
                                    @PathVariable("reservationId") String reservationId) {
        // TODO: Appropriate implementation for HTTP DELETE request
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
