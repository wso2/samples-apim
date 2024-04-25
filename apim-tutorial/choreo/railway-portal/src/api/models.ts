export interface Train {
    id: string;
    name: string;
    departure: string;
    destination: string;
    capacity: number;
    type: string;
    price: number;
}

export interface Reservation {
    id: string;
    amount: number;
    cost: number;
    train: Train;
}

export class BookingPayload {
    train: string;
    amount: number;
    constructor(train: string, amount: number) {
        this.train = train;
        this.amount = amount;
    }
}
