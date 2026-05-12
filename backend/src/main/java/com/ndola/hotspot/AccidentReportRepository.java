package com.ndola.hotspot;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AccidentReportRepository extends MongoRepository<AccidentReport, String> {

    List<AccidentReport> findByVerificationStatus(String status);

    List<AccidentReport> findByImageValidatedAndVerificationStatus(Boolean validated, String status);

    @Query("{ 'verificationStatus' : 'VERIFIED', 'imageValidated' : true, 'latitude' : { $gte : ?0 - ?2, $lte : ?0 + ?2 }, 'longitude' : { $gte : ?1 - ?2, $lte : ?1 + ?2 }, 'createdAt' : { $gt : ?3 } }")
    List<AccidentReport> findVerifiedAccidentsNearLocation(
        Double latitude,
        Double longitude,
        Double radius,
        LocalDateTime sinceDate
    );
}
