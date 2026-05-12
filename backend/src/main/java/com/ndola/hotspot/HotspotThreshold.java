package com.ndola.hotspot;

public class HotspotThreshold {
    // Accident threshold: 3 accidents within 7 days = hotspot
    public static final int ACCIDENT_COUNT_THRESHOLD = 3;
    public static final int DAYS_TO_CONSIDER = 7;
    
    // Hotspot duration: 30 days before auto-removal
    public static final int HOTSPOT_DURATION_DAYS = 30;
    
    // Image validation
    public static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    public static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"};
}
