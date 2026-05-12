package com.ndola.hotspot;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/hotspots")
@CrossOrigin(origins = "*")
public class HotspotController {

    private final HotspotService service;

    public HotspotController(HotspotService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Hotspot>> getHotspots() {
        return ResponseEntity.ok(service.getAllHotspots());
    }

    @PostMapping
    public ResponseEntity<Hotspot> createHotspot(@RequestBody Hotspot hotspot) {
        Hotspot saved = service.addHotspot(hotspot);
        return ResponseEntity.created(URI.create("/api/hotspots/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Hotspot> updateHotspot(@PathVariable String id, @RequestBody Hotspot hotspot) {
        Hotspot updated = service.updateHotspot(id, hotspot);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHotspot(@PathVariable String id) {
        service.deleteHotspot(id);
        return ResponseEntity.noContent().build();
    }
}
