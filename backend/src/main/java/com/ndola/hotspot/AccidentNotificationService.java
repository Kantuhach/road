package com.ndola.hotspot;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AccidentNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public AccidentNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyNewAccident(AccidentReport accident) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "NEW_ACCIDENT");
        message.put("accident", accident);
        message.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/accidents", message);
    }

    public void notifyAccidentResolved(String accidentId) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "ACCIDENT_RESOLVED");
        message.put("accidentId", accidentId);
        message.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/accidents", message);
    }

    public void notifyAccidentUpdated(AccidentReport accident) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "ACCIDENT_UPDATED");
        message.put("accident", accident);
        message.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/accidents", message);
    }
}
