package org.wso2.carbon.apimgt.certifications.reservationsservice.model;

public class Reservation {
    int reservationId;
    String bookName;
    String userName;
    String reservedDate;
    int reservationDuration;
    String status;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    String userId;

    public int getReservationId() {
        return reservationId;
    }

    public void setReservationId(int reservationId) {
        this.reservationId = reservationId;
    }

    public String getBookName() {
        return bookName;
    }

    public void setBookName(String bookName) {
        this.bookName = bookName;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getReservedDate() {
        return reservedDate;
    }

    public void setReservedDate(String reservedDate) {
        this.reservedDate = reservedDate;
    }

    public int getReservationDuration() {
        return reservationDuration;
    }

    public void setReservationDuration(int reservationDuration) {
        this.reservationDuration = reservationDuration;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
