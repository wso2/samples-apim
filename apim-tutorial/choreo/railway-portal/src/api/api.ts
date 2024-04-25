import { AxiosResponse } from "axios";
import { getInstance } from "./instance";
import { Train, BookingPayload, Reservation } from "./models";

export async function getTrains() {
    const resp = await getInstance().get("/trains");
    return resp.data as AxiosResponse<Train[]>;
}

export async function addBooking(payload?: BookingPayload) {
    const resp = await getInstance().post("/book", payload);
    return resp;
}

export async function getReservations() {
    const resp = await getInstance().get("/reservations");
    return resp.data as AxiosResponse<Reservation[]>;
}

export async function deleteReservation(id: string) {
    const resp = await getInstance().delete(`/reservations?id=${id}`);
    return resp;
}
