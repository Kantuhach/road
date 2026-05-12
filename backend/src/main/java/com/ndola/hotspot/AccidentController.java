package com.ndola.hotspot;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/accidents")
@CrossOrigin(origins = "*")
public class AccidentController {

    private final AccidentReportService reportService;
    private final AccidentNotificationService notificationService;

    public AccidentController(AccidentReportService reportService, AccidentNotificationService notificationService) {
        this.reportService = reportService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<AccidentReport>> getReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @PostMapping
    public ResponseEntity<AccidentReport> createReport(@RequestBody AccidentReport report) {
        AccidentReport saved = reportService.addReport(report);
        
        // Send real-time notification
        notificationService.notifyNewAccident(saved);
        
        return ResponseEntity.created(URI.create("/api/accidents/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Void> resolveAccident(@PathVariable String id) {
        reportService.resolveAccident(id);
        
        // Send real-time notification
        notificationService.notifyAccidentResolved(id);
        
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccidentReport> updateAccident(@PathVariable String id, @RequestBody AccidentReport report) {
        AccidentReport updated = reportService.updateAccident(id, report);
        
        // Send real-time notification
        notificationService.notifyAccidentUpdated(updated);
        
        return ResponseEntity.ok(updated);
    }
}
