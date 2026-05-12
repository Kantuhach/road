package com.ndola.hotspot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AccidentVerificationService {

    @Autowired
    private AccidentReportRepository accidentRepository;

    @Autowired
    private HotspotRepository hotspotRepository;

    @Autowired
    private HotspotService hotspotService;

    /**
     * Verify an accident report by admin
     */
    public AccidentReport verifyAccident(String accidentId, boolean approved, String reason) {
        Optional<AccidentReport> optional = accidentRepository.findById(accidentId);
        if (!optional.isPresent()) {
            return null;
        }

        AccidentReport accident = optional.get();
        accident.setVerificationStatus(approved ? "VERIFIED" : "REJECTED");
        accident.setVerificationReason(reason);
        accident.setVerifiedAt(LocalDateTime.now());
        accident.setStatus(approved ? "VERIFIED" : "REJECTED");

        AccidentReport saved = accidentRepository.save(accident);

        // If approved and image is valid, check if hotspot threshold is reached
        if (approved && accident.getImageValidated()) {
            checkAndCreateHotspot(accident);
        }

        return saved;
    }

    /**
     * Check if accident area meets threshold for hotspot creation
     * Threshold: 3 verified accidents within 7 days in the same area
     */
    public void checkAndCreateHotspot(AccidentReport accident) {
        // Find all verified accidents in the same area within the past 7 days
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(HotspotThreshold.DAYS_TO_CONSIDER);
        
        List<AccidentReport> recentAccidents = accidentRepository.findVerifiedAccidentsNearLocation(
            accident.getLatitude(),
            accident.getLongitude(),
            0.02, // ~2 km radius in degrees
            sevenDaysAgo
        );

        // Check if threshold is met
        if (recentAccidents.size() >= HotspotThreshold.ACCIDENT_COUNT_THRESHOLD) {
            createOrUpdateHotspot(recentAccidents);
        }
    }

    /**
     * Create or update hotspot based on accident cluster
     */
    private void createOrUpdateHotspot(List<AccidentReport> accidents) {
        if (accidents.isEmpty()) return;

        // Calculate average location
        double avgLat = accidents.stream().mapToDouble(AccidentReport::getLatitude).average().orElse(0);
        double avgLon = accidents.stream().mapToDouble(AccidentReport::getLongitude).average().orElse(0);

        // Check if hotspot already exists at this location
        Optional<Hotspot> existingHotspot = hotspotRepository.findHotspotNearLocation(avgLat, avgLon, 0.02);

        String area = accidents.get(0).getTown() + " - " + accidents.get(0).getRoadName();

        if (existingHotspot.isPresent()) {
            // Update existing hotspot
            Hotspot hotspot = existingHotspot.get();
            hotspot.setIncidentCount(accidents.size());
            hotspot.setExpiresAt(LocalDateTime.now().plusDays(HotspotThreshold.HOTSPOT_DURATION_DAYS));
            setSeverity(hotspot, accidents.size());
            hotspotRepository.save(hotspot);
        } else {
            // Create new hotspot
            Hotspot newHotspot = new Hotspot(area, avgLat, avgLon, "Medium", "All day");
            newHotspot.setIncidentCount(accidents.size());
            newHotspot.setCreatedAt(LocalDateTime.now());
            newHotspot.setExpiresAt(LocalDateTime.now().plusDays(HotspotThreshold.HOTSPOT_DURATION_DAYS));
            newHotspot.setStatus("ACTIVE");
            setSeverity(newHotspot, accidents.size());
            hotspotRepository.save(newHotspot);
        }
    }

    /**
     * Set severity based on incident count
     */
    private void setSeverity(Hotspot hotspot, int incidentCount) {
        if (incidentCount >= 10) {
            hotspot.setSeverity("High");
        } else if (incidentCount >= 5) {
            hotspot.setSeverity("Medium");
        } else {
            hotspot.setSeverity("Low");
        }
    }

    /**
     * Auto-expire hotspots that have passed their expiration date
     * Call this via scheduled task
     */
    public void expireOldHotspots() {
        List<Hotspot> hotspots = hotspotRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Hotspot hotspot : hotspots) {
            if ("ACTIVE".equals(hotspot.getStatus()) && hotspot.getExpiresAt().isBefore(now)) {
                hotspot.setStatus("EXPIRED");
                hotspotRepository.save(hotspot);
            }
        }
    }

    /**
     * Get unverified accidents waiting for admin review
     */
    public List<AccidentReport> getUnverifiedAccidents() {
        return accidentRepository.findByVerificationStatus("UNVERIFIED");
    }

    /**
     * Get pending accidents that need image validation
     */
    public List<AccidentReport> getPendingImageValidation() {
        return accidentRepository.findByImageValidatedAndVerificationStatus(false, "UNVERIFIED");
    }
}
