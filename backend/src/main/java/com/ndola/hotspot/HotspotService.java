package com.ndola.hotspot;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HotspotService {

    private final HotspotRepository repository;

    public HotspotService(HotspotRepository repository) {
        this.repository = repository;
    }

    public List<Hotspot> getAllHotspots() {
        return repository.findAll();
    }

    public Hotspot addHotspot(Hotspot hotspot) {
        return repository.save(hotspot);
    }

    public Hotspot updateHotspot(String id, Hotspot hotspot) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setName(hotspot.getName());
                    existing.setLatitude(hotspot.getLatitude());
                    existing.setLongitude(hotspot.getLongitude());
                    existing.setSeverity(hotspot.getSeverity());
                    existing.setTimePattern(hotspot.getTimePattern());
                    return repository.save(existing);
                })
                .orElseGet(() -> {
                    hotspot.setId(id);
                    return repository.save(hotspot);
                });
    }

    public void deleteHotspot(String id) {
        repository.deleteById(id);
    }
}
