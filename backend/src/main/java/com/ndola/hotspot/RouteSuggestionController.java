package com.ndola.hotspot;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/route-suggestions")
@CrossOrigin(origins = "*")
public class RouteSuggestionController {

    private static final Map<String, List<String>> ROUTE_MAP = new HashMap<>();


    static {
        ROUTE_MAP.put("Town Centre", List.of(
                "Use the bypass via George Road instead of Main Street.",
                "Take Chifubu Road and exit at Kansenshi to avoid congestion.",
                "Use Ndeke connector road to bypass the accident zone."));

        ROUTE_MAP.put("Kansenshi", List.of(
                "Turn left onto Sibonelo Road and follow the alternative ring route.",
                "Use Masala Road and join Twapia Road to avoid the blocked section.",
                "Exit via Itawa road for a faster detour."));

        ROUTE_MAP.put("Masala", List.of(
                "Use Chipulukusu Road to avoid the main Masala intersection.",
                "Take the Nchanga bypass and reconnect at Chifubu.",
                "Use Mmamfubilu Road for a lesser-used route."));

        ROUTE_MAP.put("Itawa", List.of(
                "Take the new bypass through Ndeke instead of Itawa main road.",
                "Use Edgewood Avenue to reduce travel time.",
                "Avoid the inner loop and join the M4 alternative."));

        ROUTE_MAP.put("Main Street", List.of(
                "Use George Road bypass to avoid downtown traffic.",
                "Take Market Avenue and connect to United Road.",
                "Use the northern route via Chifubu Road."));

        ROUTE_MAP.put("George Road", List.of(
                "Connect to Chifubu Road for a direct route.",
                "Use the Main Street underpass to avoid surface congestion.",
                "Take the eastern bypass through Market Avenue."));

        ROUTE_MAP.put("Market Avenue", List.of(
                "Use United Road to connect to the main highway.",
                "Take Main Street southbound for local access.",
                "Connect via Twapia Road for industrial areas."));

        ROUTE_MAP.put("Chifubu Road", List.of(
                "Use Sibonelo Road for the western bypass.",
                "Connect to Kamwala Road for residential areas.",
                "Take Omsa Road for the northern extension."));

        ROUTE_MAP.put("Sibonelo Road", List.of(
                "Connect to United Road for the main commercial district.",
                "Use Chifubu Road for the eastern route.",
                "Take the ring road for circumferential travel."));

        ROUTE_MAP.put("United Road", List.of(
                "Use Twapia Road for industrial and mining areas.",
                "Connect to Luapula Road for northern access.",
                "Take Boma Road for eastern development."));

        ROUTE_MAP.put("Twapia Road", List.of(
                "Connect to Masala Road for the central business district.",
                "Use United Road for the main highway connection.",
                "Take the southern bypass to avoid peak traffic."));

        ROUTE_MAP.put("Masala Road", List.of(
                "Use Chipulukusu Road for the university area.",
                "Connect to Nchanga Bypass for mining routes.",
                "Take Twapia Road for alternative access."));

        ROUTE_MAP.put("Chipulukusu Road", List.of(
                "Connect to Itawa Road for the main southern route.",
                "Use Mapalo Road for local distribution.",
                "Take Nkana Road for industrial access."));

        ROUTE_MAP.put("Itawa Road", List.of(
                "Use M4 Highway for long-distance travel.",
                "Connect to Ndeke Connector for the eastern bypass.",
                "Take Edgewood Avenue for residential areas."));

        ROUTE_MAP.put("M4 Highway", List.of(
                "Use Ndeke Connector for the Ndola bypass.",
                "Connect to Itawa Road for local access.",
                "Take the main highway for inter-city travel."));

        ROUTE_MAP.put("Ndeke Connector", List.of(
                "Connect to Ndeke Road for the new development area.",
                "Use M4 Highway for main road access.",
                "Take Chipulukusu Drive for residential routes."));

        ROUTE_MAP.put("Ndeke Road", List.of(
                "Use Chipulukusu Drive for the extension route.",
                "Connect to Ndeke Connector for highway access.",
                "Take Tui Street for local access."));

        ROUTE_MAP.put("Chipulukusu Drive", List.of(
                "Connect to Tui Street for the terminal point.",
                "Use Ndeke Road for the main connection.",
                "Take the drive for scenic routes."));

        ROUTE_MAP.put("Kamwala Road", List.of(
                "Connect to Omsa Road for the northern extension.",
                "Use Chifubu Road for main access.",
                "Take the road for residential development."));

        ROUTE_MAP.put("Omsa Road", List.of(
                "Use Kamwala Road for the connection route.",
                "Take the road for northern development access."));

        ROUTE_MAP.put("Luapula Road", List.of(
                "Connect to Boma Road for eastern access.",
                "Use United Road for main highway connection.",
                "Take the road for cross-border routes."));

        ROUTE_MAP.put("Boma Road", List.of(
                "Use Luapula Road for the connection route.",
                "Connect to United Road for commercial access.",
                "Take the road for eastern development."));

        ROUTE_MAP.put("Mapalo Road", List.of(
                "Connect to Nkana Road for industrial routes.",
                "Use Chipulukusu Road for main access.",
                "Take the road for distribution networks."));

        ROUTE_MAP.put("Nkana Road", List.of(
                "Use Mapalo Road for the connection route.",
                "Connect to Chipulukusu Road for university access.",
                "Take the road for mining area routes."));

        ROUTE_MAP.put("Nchanga Bypass", List.of(
                "Connect back to Masala Road for main access.",
                "Use the bypass to avoid mining traffic congestion."));

        ROUTE_MAP.put("Edgewood Avenue", List.of(
                "Connect to Itawa Road for main southern access.",
                "Use the avenue for residential and commercial routes."));
    }

    @GetMapping
    public ResponseEntity<List<String>> getSuggestions(@RequestParam(required = false) String town) {
        if (town == null || town.isBlank()) {
            List<String> defaults = new ArrayList<>();
            defaults.add("Use an alternate route whenever you see an active accident report.");
            defaults.add("Stay updated by checking live reports before you drive.");
            defaults.add("Avoid major junctions during high traffic hours.");
            defaults.add("Check the Ndola Road Network Map for real-time hotspots.");
            return ResponseEntity.ok(defaults);
        }

        List<String> suggestions = ROUTE_MAP.get(town);
        if (suggestions == null) {
            // Try to find suggestions for similar road names
            String lowerTown = town.toLowerCase();
            for (Map.Entry<String, List<String>> entry : ROUTE_MAP.entrySet()) {
                if (entry.getKey().toLowerCase().contains(lowerTown) ||
                    lowerTown.contains(entry.getKey().toLowerCase())) {
                    suggestions = entry.getValue();
                    break;
                }
            }

            if (suggestions == null) {
                suggestions = new ArrayList<>();
                suggestions.add("No specific route suggestions available for " + town + ".");
                suggestions.add("Check nearby major roads for alternative routes.");
                suggestions.add("Use the Ndola Road Network Map to plan your journey.");
            }
        }

        return ResponseEntity.ok(suggestions);
    }
}
