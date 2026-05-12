package com.ndola.hotspot;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*")
public class HealthController {

    private final DriverRepository driverRepository;

    public HealthController(DriverRepository driverRepository) {
        this.driverRepository = driverRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Backend server is running");
        response.put("timestamp", System.currentTimeMillis());

        try {
            long driverCount = driverRepository.count();
            response.put("mongodb", "CONNECTED");
            response.put("drivers_in_db", driverCount);
        } catch (Exception e) {
            response.put("mongodb", "DISCONNECTED");
            response.put("error", "MongoDB connection failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
