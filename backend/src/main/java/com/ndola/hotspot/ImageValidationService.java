package com.ndola.hotspot;

import java.util.Base64;

public class ImageValidationService {

    public static class ValidationResult {
        private boolean valid;
        private String reason;

        public ValidationResult(boolean valid, String reason) {
            this.valid = valid;
            this.reason = reason;
        }

        public boolean isValid() { return valid; }
        public String getReason() { return reason; }
    }

    /**
     * Validate image base64 string
     * Checks file size and format
     */
    public static ValidationResult validateImage(String base64Image) {
        if (base64Image == null || base64Image.isEmpty()) {
            return new ValidationResult(false, "Image is required");
        }

        try {
            // Remove data URI prefix if present
            String imageData = base64Image;
            if (base64Image.contains(",")) {
                imageData = base64Image.split(",")[1];
            }

            byte[] decodedImage;
            try {
                decodedImage = Base64.getDecoder().decode(imageData);
            } catch (IllegalArgumentException e) {
                return new ValidationResult(false, "Invalid base64 format");
            }

            // Check file size (5 MB max)
            if (decodedImage.length > HotspotThreshold.MAX_IMAGE_SIZE_BYTES) {
                return new ValidationResult(false, "Image exceeds maximum size of 5 MB");
            }

            // Check image magic numbers for valid format
            if (!isValidImageFormat(decodedImage)) {
                return new ValidationResult(false, "Image format not supported. Use JPEG, PNG, or WebP");
            }

            return new ValidationResult(true, "Image is valid");
        } catch (Exception e) {
            return new ValidationResult(false, "Failed to validate image: " + e.getMessage());
        }
    }

    /**
     * Check if byte array contains valid image magic numbers
     */
    private static boolean isValidImageFormat(byte[] imageData) {
        if (imageData.length < 4) {
            return false;
        }

        // JPEG: FF D8 FF
        if (imageData[0] == (byte) 0xFF && imageData[1] == (byte) 0xD8 && imageData[2] == (byte) 0xFF) {
            return true;
        }

        // PNG: 89 50 4E 47
        if (imageData[0] == (byte) 0x89 && imageData[1] == 0x50 && 
            imageData[2] == 0x4E && imageData[3] == 0x47) {
            return true;
        }

        // WebP: RIFF ... WEBP
        if (imageData[0] == 0x52 && imageData[1] == 0x49 && 
            imageData[2] == 0x46 && imageData[3] == 0x46) {
            if (imageData.length > 12) {
                if (imageData[8] == 0x57 && imageData[9] == 0x45 && 
                    imageData[10] == 0x42 && imageData[11] == 0x50) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Score image credibility based on characteristics
     * Returns score 0-100 where 100 is most credible
     */
    public static int scoreImageCredibility(String base64Image, String description) {
        int score = 50; // Base score

        // Bonus: Large image size suggests real photo (50KB+)
        if (base64Image != null && base64Image.length() > 50000) {
            score += 15;
        }

        // Bonus: Detailed description suggests genuine report
        if (description != null && description.length() > 50) {
            score += 20;
        }

        // Bonus: Image not too small (> 10KB)
        if (base64Image != null && base64Image.length() > 10000) {
            score += 15;
        }

        return Math.min(score, 100);
    }
}
