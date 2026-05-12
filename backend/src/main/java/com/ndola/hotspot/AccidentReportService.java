package com.ndola.hotspot;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccidentReportService {

    private final AccidentReportRepository repository;

    public AccidentReportService(AccidentReportRepository repository) {
        this.repository = repository;
    }

    public List<AccidentReport> getAllReports() {
        return repository.findAll();
    }

    public AccidentReport addReport(AccidentReport report) {
        report.setStatus("PENDING");
        report.setVerificationStatus("UNVERIFIED");
        
        // Validate image if provided
        if (report.getPhotoUrl() != null && !report.getPhotoUrl().isEmpty()) {
            ImageValidationService.ValidationResult validationResult = ImageValidationService.validateImage(report.getPhotoUrl());
            report.setImageValidated(validationResult.isValid());
        }
        
        return repository.save(report);
    }

    public void resolveAccident(String id) {
        AccidentReport accident = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Accident not found: " + id));
        
        accident.setStatus("resolved");
        repository.save(accident);
    }

    public AccidentReport updateAccident(String id, AccidentReport updatedReport) {
        AccidentReport existing = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Accident not found: " + id));
        
        // Update fields that can be modified
        if (updatedReport.getDescription() != null) {
            existing.setDescription(updatedReport.getDescription());
        }
        if (updatedReport.getSeverity() != null) {
            existing.setSeverity(updatedReport.getSeverity());
        }
        if (updatedReport.getStatus() != null) {
            existing.setStatus(updatedReport.getStatus());
        }
        if (updatedReport.getVerificationStatus() != null) {
            existing.setVerificationStatus(updatedReport.getVerificationStatus());
        }
        if (updatedReport.getVerificationReason() != null) {
            existing.setVerificationReason(updatedReport.getVerificationReason());
        }
        
        return repository.save(existing);
    }
}
