package com.example.reviews.entity;

public class Review {
    private String id;
    private String body;
    private String productUpc;
    private String authorId;
    private String authorUsername;

    public Review(String id, String body, String productUpc, String authorId, String authorUsername) {
        this.id = id;
        this.body = body;
        this.productUpc = productUpc;
        this.authorId = authorId;
        this.authorUsername = authorUsername;
    }

    public String getId() {
        return id;
    }

    public String getBody() {
        return body;
    }

    public String getProductUpc() {
        return productUpc;
    }

    public String getAuthorId() {
        return authorId;
    }

    public String getAuthorUsername() {
        return authorUsername;
    }
}
