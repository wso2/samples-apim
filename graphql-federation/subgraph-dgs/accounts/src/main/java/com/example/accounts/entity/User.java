package com.example.accounts.entity;

public class User {
    private String id;
    private String name;
    private String username;

    public User(String id, String name, String username) {
        this.id = id;
        this.name = name;
        this.username = username;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getUsername() {
        return username;
    }
}
