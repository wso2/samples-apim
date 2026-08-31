package com.example.reviews.repository;

import com.example.reviews.entity.Review;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Repository
public class ReviewRepository {
    private final List<Review> allReviews = List.of(
            new Review("f29c564f-842b-4d8b-ad1c-e4b5f8ab5ece", "It is good", "UPC001", "b79dccc1-a0a4-410b-9c83-3c3cec7dc3d5", "john"),
            new Review("931e924a-9fc9-4a99-a1f7-9dab511e222d", "It is bad", "UPC001", "b3e21fe8-7d2b-4ce6-95e5-7a39fa4ad448", "jane"),
            new Review("2e2e662e-8e11-4993-8542-6bc93c66556a", "It is terrible", "UPC001", "c084ec68-6294-4ff2-a84b-a7cfd0b7b2b4", "james"),
            new Review("98ab732e-8c7b-4ccb-a840-322765bfe0f6", "It is great", "UPC002", "c084ec68-6294-4ff2-a84b-a7cfd0b7b2b4", "james"),
            new Review("a69b8ae2-a552-44ee-8a05-0512b4f26364", "It is excellent", "UPC003", "b3e21fe8-7d2b-4ce6-95e5-7a39fa4ad448", "jane"),
            new Review("1f70c59c-948f-4764-8c8f-4bfbd3ed05a5", "It is so so", "UPC004", "b3e21fe8-7d2b-4ce6-95e5-7a39fa4ad448", "jane"),
            new Review("273f2ab6-99c0-45bc-ba59-90e9fba3dbd4", "It is good", "UPC005", "b79dccc1-a0a4-410b-9c83-3c3cec7dc3d5", "john"),
            new Review("f68cb8b8-0324-4387-bb4a-f79bc8ef6c41", "It is good", "UPC005", "b3e21fe8-7d2b-4ce6-95e5-7a39fa4ad448", "jane"),
            new Review("d46cbfc3-855d-4984-9ba3-f85fe2345291", "It is so bad", "UPC006", "b79dccc1-a0a4-410b-9c83-3c3cec7dc3d5", "john"),
            new Review("d866e8f9-89a0-4660-8104-b4e4cb09c9b1", "It is bad", "UPC007", "b79dccc1-a0a4-410b-9c83-3c3cec7dc3d5", "john"),
            new Review("5976574c-7f4e-4b2f-bdef-657964aa4cfe", "It is bad", "UPC007", "b3e21fe8-7d2b-4ce6-95e5-7a39fa4ad448", "jane"),
            new Review("f86539f2-637c-4dda-90dc-4d9d60207393", "It is great", "UPC007", "c084ec68-6294-4ff2-a84b-a7cfd0b7b2b4", "james"),
            new Review("8a0b6d91-565d-447d-b775-69220db19891", "It is terrible", "UPC008", "b79dccc1-a0a4-410b-9c83-3c3cec7dc3d5", "john"),
            new Review("470bc616-831d-47f1-bea2-ad74c51ad384", "It is great", "UPC008", "c084ec68-6294-4ff2-a84b-a7cfd0b7b2b4", "james"),
            new Review("2c66892c-fb19-4ef8-ab33-de44c93aa3a1", "It is bad", "UPC009", "b3e21fe8-7d2b-4ce6-95e5-7a39fa4ad448", "jane"),
            new Review("a2077840-d115-43ba-94d1-d79d2af529a7", "It is terrible", "UPC010", "b3e21fe8-7d2b-4ce6-95e5-7a39fa4ad448", "jane")
    );

    public List<Review> findByProductUpc(String productUpc) {
        return allReviews.stream()
                .filter(r -> Objects.equals(r.getProductUpc(), productUpc))
                .collect(Collectors.toList());
    }
}
