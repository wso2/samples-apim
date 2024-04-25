package com.example.inventory.entity;

public class Product {
    private String upc;
    private int price;
    private int weight;

    public Product(String upc, int price, int weight) {
        this.upc = upc;
        this.price = price;
        this.weight = weight;
    }

    public String getUpc() {
        return upc;
    }

    public int getPrice() {
        return price;
    }

    public int getWeight() {
        return weight;
    }
}
