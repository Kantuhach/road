package com.ndola.hotspot;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "accident_reports")
public class AccidentReport {

    @Id
    private String id;

    private String reporterName;

    private String driverUsername;

    private String town;

    private String roadName;

    private Double latitude;

    private Double longitude;

    private String description;

    private String photoUrl;

    private String status;

    private LocalDateTime createdAt;

    private String verificationStatus = "UNVERIFIED";

    private String verificationReason;

    private Boolean imageValidated = false;

    private LocalDateTime verifiedAt;

    public AccidentReport() {
    }

    public AccidentReport(String reporterName, String driverUsername, String town, String roadName,
                          Double latitude, Double longitude, String description, String photoUrl) {
        this.reporterName = reporterName;
        this.driverUsername = driverUsername;
        this.town = town;
        this.roadName = roadName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.description = description;
        this.photoUrl = photoUrl;
        this.status = "Open";
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }

    public String getDriverUsername() {
        return driverUsername;
    }

    public void setDriverUsername(String driverUsername) {
        this.driverUsername = driverUsername;
    }

    public String getTown() {
        return town;
    }

    public void setTown(String town) {
        this.town = town;
    }

    public String getRoadName() {
        return roadName;
    }

    public void setRoadName(String roadName) {
        this.roadName = roadName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getVerificationReason() {
        return verificationReason;
    }

    public void setVerificationReason(String verificationReason) {
        this.verificationReason = verificationReason;
    }

    public Boolean getImageValidated() {
        return imageValidated;
    }

    public void setImageValidated(Boolean imageValidated) {
        this.imageValidated = imageValidated;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
