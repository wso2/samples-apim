package com.example.products.entity;

public class Product {
    private String upc;
    private String name;
    private int price;
    private int weight;

    public Product(String upc, String name, int price, int weight) {
        this.upc = upc;
        this.name = name;
        this.price = price;
        this.weight = weight;
    }

    public String getUpc() {
        return upc;
    }

    public String getName() {
        return name;
    }

    public int getPrice() {
        return price;
    }

    public int getWeight() {
        return weight;
    }
}
