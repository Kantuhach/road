package com.ndola.hotspot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/verification")
@CrossOrigin(origins = "*")
public class VerificationController {

    @Autowired
    private AccidentVerificationService verificationService;

    @Autowired
    private AccidentReportRepository accidentRepository;

    /**
     * Get all unverified accidents for admin review
     */
    @GetMapping("/pending-accidents")
    public ResponseEntity<List<AccidentReport>> getPendingAccidents() {
        List<AccidentReport> unverified = verificationService.getUnverifiedAccidents();
        return ResponseEntity.ok(unverified);
    }

    /**
     * Get accidents pending image validation
     */
    @GetMapping("/pending-image-validation")
    public ResponseEntity<List<AccidentReport>> getPendingImageValidation() {
        List<AccidentReport> pending = verificationService.getPendingImageValidation();
        return ResponseEntity.ok(pending);
    }

    /**
     * Validate image for a specific accident
     */
    @PostMapping("/validate-image/{accidentId}")
    public ResponseEntity<Map<String, Object>> validateImage(@PathVariable String accidentId) {
        Optional<AccidentReport> optional = accidentRepository.findById(accidentId);
        if (!optional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        AccidentReport accident = optional.get();
        if (accident.getPhotoUrl() == null || accident.getPhotoUrl().isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("reason", "No image attached");
            response.put("accidentId", accidentId);
            return ResponseEntity.ok(response);
        }

        // Validate image
        ImageValidationService.ValidationResult validationResult = ImageValidationService.validateImage(accident.getPhotoUrl());
        
        Map<String, Object> response = new HashMap<>();
        response.put("valid", validationResult.isValid());
        response.put("reason", validationResult.getReason());
        response.put("accidentId", accidentId);

        if (validationResult.isValid()) {
            // Score credibility
            int credibilityScore = ImageValidationService.scoreImageCredibility(
                accident.getPhotoUrl(),
                accident.getDescription()
            );
            response.put("credibilityScore", credibilityScore);

            // Mark as validated
            accident.setImageValidated(true);
            accidentRepository.save(accident);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Admin approves or rejects an accident report
     */
    @PostMapping("/verify-accident/{accidentId}")
    public ResponseEntity<Map<String, Object>> verifyAccident(
            @PathVariable String accidentId,
            @RequestParam boolean approved,
            @RequestParam(required = false) String reason) {

        AccidentReport verified = verificationService.verifyAccident(accidentId, approved, reason);

        if (verified == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("accidentId", accidentId);
        response.put("status", verified.getVerificationStatus());
        response.put("reason", verified.getVerificationReason());
        response.put("message", approved ? "Accident verified successfully" : "Accident rejected");

        return ResponseEntity.ok(response);
    }

    /**
     * Manually trigger hotspot expiration check
     */
    @PostMapping("/expire-hotspots")
    public ResponseEntity<Map<String, String>> expireOldHotspots() {
        verificationService.expireOldHotspots();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Hotspot expiration check completed");
        return ResponseEntity.ok(response);
    }
}
