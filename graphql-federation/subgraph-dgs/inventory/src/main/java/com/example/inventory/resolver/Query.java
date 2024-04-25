package com.example.inventory.resolver;

import com.example.inventory.entity.Product;
import com.example.inventory.entity.ProductInventory;
import com.example.inventory.repository.InventoryRepository;
import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsData;
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment;
import com.netflix.graphql.dgs.DgsEntityFetcher;

import java.util.Map;

@DgsComponent
public class Query {
    private final InventoryRepository inventoryRepository;

    public Query(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @DgsEntityFetcher(name = "Product")
    public Product product(Map<String, Object> values) {
        return new Product(
                (String) values.get("upc"),
                (int) values.getOrDefault("price", 0),
                (int) values.getOrDefault("weight", 0));
    }

    @DgsData(parentType = "Product", field = "inStock")
    public Boolean checkProductInStock(DgsDataFetchingEnvironment dataFetchingEnvironment) {
        Product product = dataFetchingEnvironment.getSource();
        ProductInventory inventory = inventoryRepository.findByUpc(product.getUpc());
        return inventory != null && inventory.isInStock();
    }

    @DgsData(parentType = "Product", field = "shippingEstimate")
    public Integer estimateShipment(DgsDataFetchingEnvironment dataFetchingEnvironment) {
        Product product = dataFetchingEnvironment.getSource();
        if (product.getPrice() > 100) return 0;
        return product.getWeight() * 2;
    }
}
