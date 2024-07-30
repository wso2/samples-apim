package com.example.reviews.resolver;

import com.example.reviews.entity.Product;
import com.example.reviews.entity.Review;
import com.example.reviews.entity.User;
import com.example.reviews.repository.ReviewRepository;
import com.netflix.graphql.dgs.*;

import java.util.List;
import java.util.Map;

@DgsComponent
public class Query {
    private final ReviewRepository reviewRepository;

    public Query(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @DgsEntityFetcher(name = "Product")
    public Product product(Map<String, Object> values) {
        return new Product((String) values.get("upc"));
    }

    @DgsEntityFetcher(name = "User")
    public User author(Map<String, Object> values) {
        return new User((String) values.get("id"), null);
    }

    @DgsData(parentType = "Product", field = "reviews")
    public List<Review> getReviewsForProduct(DgsDataFetchingEnvironment dataFetchingEnvironment) {
        Product product = dataFetchingEnvironment.getSource();
        return reviewRepository.findByProductUpc(product.getUpc());
    }

    @DgsData(parentType = "Review", field = "product")
    public Product getReviewProduct(DgsDataFetchingEnvironment dataFetchingEnvironment) {
        Review review = dataFetchingEnvironment.getSource();
        return new Product(review.getProductUpc());
    }

    @DgsData(parentType = "Review", field = "author")
    public User getReviewAuthor(DgsDataFetchingEnvironment dataFetchingEnvironment) {
        Review review = dataFetchingEnvironment.getSource();
        return new User(review.getAuthorId(), review.getAuthorUsername());
    }
}
