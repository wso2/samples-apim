package com.example.accounts.repository;

import com.example.accounts.entity.User;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Objects;

@Repository
public class UserRepository {
    private final List<User> allUsers = List.of(
            new User("b79dccc1-a0a4-410b-9c83-3c3cec7dc3d5", "John Doe", "john"),
            new User("b3e21fe8-7d2b-4ce6-95e5-7a39fa4ad448", "Jane Doe", "jane"),
            new User("c084ec68-6294-4ff2-a84b-a7cfd0b7b2b4", "James Doe", "james")
    );

    public User findByUsername(String username) {
        return allUsers.stream()
                .filter(u -> Objects.equals(u.getUsername(), username))
                .findFirst()
                .orElse(null);
    }

    public User findById(String id) {
        return allUsers.stream()
                .filter(u -> Objects.equals(u.getId(), id))
                .findFirst()
                .orElse(null);
    }
}
