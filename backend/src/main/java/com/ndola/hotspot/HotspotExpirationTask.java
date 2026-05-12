package com.ndola.hotspot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
public class HotspotExpirationTask {

    @Autowired
    private AccidentVerificationService verificationService;

    /**
     * Run hotspot expiration check every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void checkAndExpireHotspots() {
        verificationService.expireOldHotspots();
    }
}
