package com.example.products.resolver;

import com.example.products.entity.Product;
import com.example.products.repository.ProductRepository;
import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsEntityFetcher;
import com.netflix.graphql.dgs.DgsQuery;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@DgsComponent
public class Query {
    private final ProductRepository productRepository;

    public Query(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @DgsEntityFetcher(name = "Product")
    public Product resolveReference(Map<String, Object> values) {
        return productRepository.findByUpc((String) values.get("upc"));
    }

    @DgsQuery
    public List<Product> topProducts(Integer first) {
        return productRepository.findAll()
                .stream()
                .limit(first)
                .collect(Collectors.toList());
    }
    @DgsQuery
    public Product productB(String upc) {
        return productRepository.findByUpc(upc);
    }
}
