package com.example.inventory.repository;

import com.example.inventory.entity.ProductInventory;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Objects;

@Repository
public class InventoryRepository {
    private final List<ProductInventory> allInventory = List.of(
            new ProductInventory("UPC001", true),
            new ProductInventory("UPC002", false),
            new ProductInventory("UPC003", false),
            new ProductInventory("UPC004", true),
            new ProductInventory("UPC005", true),
            new ProductInventory("UPC006", true),
            new ProductInventory("UPC007", false),
            new ProductInventory("UPC008", true),
            new ProductInventory("UPC009", true),
            new ProductInventory("UPC010", true)
    );

    public ProductInventory findByUpc(String upc) {
        return allInventory.stream()
                .filter(i -> Objects.equals(i.getUpc(), upc))
                .findFirst()
                .orElse(null);
    }
}
