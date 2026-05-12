package com.ndola.hotspot;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.LocalDateTime;
import java.util.logging.Logger;

@SpringBootApplication
@EnableScheduling
public class RoadAccidentHotspotApplication {

    private static final Logger LOGGER = Logger.getLogger(RoadAccidentHotspotApplication.class.getName());

    public static void main(String[] args) {
        SpringApplication.run(RoadAccidentHotspotApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedData(HotspotRepository hotspotRepository,
                                      DriverRepository driverRepository,
                                      AccidentReportRepository accidentRepository) {
        return args -> {
            try {
                LOGGER.info("Starting seed data initialization...");
                
                // Seed hotspots
                try {
                    if (hotspotRepository.count() == 0) {
                        LOGGER.info("Initializing hotspots...");
                        // Create hotspots with expiration dates
                        Hotspot h1 = new Hotspot("Town Centre", -12.7832, 28.6545, "High", "Morning Peak");
                        h1.setCreatedAt(LocalDateTime.now().minusDays(15));
                        h1.setExpiresAt(LocalDateTime.now().plusDays(15));
                        h1.setIncidentCount(8);
                        h1.setStatus("ACTIVE");
                        hotspotRepository.save(h1);

                        Hotspot h2 = new Hotspot("Kansenshi", -12.8033, 28.6243, "Medium", "Evening Peak");
                        h2.setCreatedAt(LocalDateTime.now().minusDays(10));
                        h2.setExpiresAt(LocalDateTime.now().plusDays(20));
                        h2.setIncidentCount(5);
                        h2.setStatus("ACTIVE");
                        hotspotRepository.save(h2);

                        Hotspot h3 = new Hotspot("Masala", -12.8155, 28.6099, "High", "Afternoon");
                        h3.setCreatedAt(LocalDateTime.now().minusDays(5));
                        h3.setExpiresAt(LocalDateTime.now().plusDays(25));
                        h3.setIncidentCount(12);
                        h3.setStatus("ACTIVE");
                        hotspotRepository.save(h3);

                        Hotspot h4 = new Hotspot("Itawa", -12.8290, 28.6758, "Low", "Night");
                        h4.setCreatedAt(LocalDateTime.now().minusDays(20));
                        h4.setExpiresAt(LocalDateTime.now().minusDays(5));
                        h4.setIncidentCount(3);
                        h4.setStatus("EXPIRED");
                        hotspotRepository.save(h4);

                        Hotspot h5 = new Hotspot("Ndeke", -12.8070, 28.7275, "Medium", "Morning Peak");
                        h5.setCreatedAt(LocalDateTime.now().minusDays(8));
                        h5.setExpiresAt(LocalDateTime.now().plusDays(22));
                        h5.setIncidentCount(6);
                        h5.setStatus("ACTIVE");
                        hotspotRepository.save(h5);

                        Hotspot h6 = new Hotspot("Chifubu", -12.7838, 28.6549, "Medium", "Evening Peak");
                        h6.setCreatedAt(LocalDateTime.now().minusDays(12));
                        h6.setExpiresAt(LocalDateTime.now().plusDays(18));
                        h6.setIncidentCount(7);
                        h6.setStatus("ACTIVE");
                        hotspotRepository.save(h6);

                        Hotspot h7 = new Hotspot("Twapia", -12.8015, 28.6151, "High", "Rush Hour");
                        h7.setCreatedAt(LocalDateTime.now().minusDays(3));
                        h7.setExpiresAt(LocalDateTime.now().plusDays(27));
                        h7.setIncidentCount(10);
                        h7.setStatus("ACTIVE");
                        hotspotRepository.save(h7);

                        Hotspot h8 = new Hotspot("Chipulukusu", -12.7956, 28.6222, "High", "Evening");
                        h8.setCreatedAt(LocalDateTime.now().minusDays(6));
                        h8.setExpiresAt(LocalDateTime.now().plusDays(24));
                        h8.setIncidentCount(9);
                        h8.setStatus("ACTIVE");
                        hotspotRepository.save(h8);
                        
                        LOGGER.info("Hotspots initialized successfully");
                    }
                } catch (Exception e) {
                    LOGGER.warning("Failed to initialize hotspots: " + e.getMessage());
                }

                // Seed driver
                try {
                    if (!driverRepository.existsByUsername("demo")) {
                        LOGGER.info("Creating demo driver...");
                        driverRepository.save(new Driver("demo", "demo@ndola.com", "demo123"));
                        LOGGER.info("Demo driver created successfully");
                    }
                } catch (Exception e) {
                    LOGGER.warning("Failed to create demo driver: " + e.getMessage());
                }

                // Seed accident reports
                try {
                    if (accidentRepository.count() == 0) {
                        LOGGER.info("Initializing accident reports...");
                        // Create verified accident with validated image
                        AccidentReport a1 = new AccidentReport(
                                "Chanda", "demo", "Town Centre", "Main Street", -12.7832, 28.6545,
                                "Multi-car collision blocking two lanes. Drivers should avoid the main intersection.",
                                "https://via.placeholder.com/320x180.png?text=Accident+photo"
                        );
                        a1.setStatus("VERIFIED");
                        a1.setVerificationStatus("VERIFIED");
                        a1.setImageValidated(true);
                        a1.setVerifiedAt(LocalDateTime.now().minusDays(1));
                        accidentRepository.save(a1);

                        // Create unverified accident
                        AccidentReport a2 = new AccidentReport(
                                "Mwale", "demo", "Kansenshi", "Independence Avenue", -12.8033, 28.6243,
                                "Vehicle hit a pothole causing damage. Road infrastructure needs repair.",
                                "https://via.placeholder.com/320x180.png?text=Road+damage"
                        );
                        a2.setStatus("PENDING");
                        a2.setVerificationStatus("UNVERIFIED");
                        a2.setImageValidated(false);
                        accidentRepository.save(a2);

                        // Create rejected accident
                        AccidentReport a3 = new AccidentReport(
                                "Banda", "demo", "Masala", "Cairo Road", -12.8155, 28.6099,
                                "Minor scratch on car paint.",
                                "https://via.placeholder.com/320x180.png?text=Minor+scratch"
                        );
                        a3.setStatus("REJECTED");
                        a3.setVerificationStatus("REJECTED");
                        a3.setImageValidated(false);
                        a3.setVerificationReason("Not a significant accident - minor scratch only");
                        a3.setVerifiedAt(LocalDateTime.now().minusDays(2));
                        accidentRepository.save(a3);
                        
                        LOGGER.info("Accident reports initialized successfully");
                    }
                } catch (Exception e) {
                    LOGGER.warning("Failed to initialize accident reports: " + e.getMessage());
                }
                
                LOGGER.info("Seed data initialization completed");
            } catch (Exception e) {
                LOGGER.severe("Fatal error during seed data initialization: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }
}
