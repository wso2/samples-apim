package com.example.accounts.resolver;

import com.example.accounts.entity.User;
import com.example.accounts.repository.UserRepository;
import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsEntityFetcher;
import com.netflix.graphql.dgs.DgsQuery;

import java.util.Map;

@DgsComponent
public class Query {
    private final UserRepository userRepository;

    public Query(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @DgsEntityFetcher(name = "User")
    public User resolveReference(Map<String, Object> values) {
        return userRepository.findById((String) values.get("id"));
    }

    @DgsQuery(field = "me")
    public User getCurrentUser() {
        return userRepository.findByUsername("john");
    }
}
