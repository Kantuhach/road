package com.ndola.hotspot;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HotspotRepository extends MongoRepository<Hotspot, String> {

    @Query("{ 'status' : 'ACTIVE', 'latitude' : { $gte : ?0 - ?2, $lte : ?0 + ?2 }, 'longitude' : { $gte : ?1 - ?2, $lte : ?1 + ?2 } }")
    Optional<Hotspot> findHotspotNearLocation(
        Double latitude,
        Double longitude,
        Double radius
    );
}
