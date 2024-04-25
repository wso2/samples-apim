package com.example.products.repository;

import com.example.products.entity.Product;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Objects;

@Repository
public class ProductRepository {
    private final List<Product> allProducts = List.of(
            new Product("UPC001", "Product 1", 10, 10),
            new Product("UPC002", "Product 2", 50, 9),
            new Product("UPC003", "Product 3", 60, 15),
            new Product("UPC004", "Product 4", 35, 20),
            new Product("UPC005", "Product 5", 48, 4),
            new Product("UPC006", "Product 6", 20, 6),
            new Product("UPC007", "Product 7", 100, 3),
            new Product("UPC008", "Product 8", 140, 5),
            new Product("UPC009", "Product 9", 28, 12),
            new Product("UPC010", "Product 10", 56, 9)
    );

    public List<Product> findAll() {
        return allProducts;
    }

    public Product findByUpc(String upc) {
        return allProducts.stream()
                .filter(p -> Objects.equals(p.getUpc(), upc))
                .findFirst()
                .orElse(null);
    }
}
