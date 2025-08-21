package com.example.inventory.entity;

public class ProductInventory {
    private String upc;
    private boolean inStock;

    public ProductInventory(String upc, boolean inStock) {
        this.upc = upc;
        this.inStock = inStock;
    }

    public String getUpc() {
        return upc;
    }

    public void setUpc(String upc) {
        this.upc = upc;
    }

    public boolean isInStock() {
        return inStock;
    }

    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }
}
