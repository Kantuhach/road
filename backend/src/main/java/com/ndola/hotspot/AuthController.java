package com.ndola.hotspot;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final DriverService driverService;

    public AuthController(DriverService driverService) {
        this.driverService = driverService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Username is required"));
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email is required"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Password is required"));
        }
        
        if (driverService.usernameExists(request.getUsername())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Username already exists"));
        }

        Driver driver = new Driver(request.getUsername(), request.getEmail(), request.getPassword());
        Driver saved = driverService.register(driver);
        AuthResponse response = new AuthResponse(saved.getId(), saved.getUsername(), saved.getEmail());
        return ResponseEntity.created(URI.create("/api/auth/register"))
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Username is required"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Password is required"));
        }
        
        Optional<Driver> existing = driverService.findByUsername(request.getUsername());
        if (existing.isEmpty() || !existing.get().getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid username or password"));
        }

        Driver driver = existing.get();
        AuthResponse response = new AuthResponse(driver.getId(), driver.getUsername(), driver.getEmail());
        return ResponseEntity.ok(response);
    }

    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class AuthResponse {
        private String id;
        private String username;
        private String email;

        public AuthResponse(String id, String username, String email) {
            this.id = id;
            this.username = username;
            this.email = email;
        }

        public String getId() {
            return id;
        }

        public String getUsername() {
            return username;
        }

        public String getEmail() {
            return email;
        }
    }

    public static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
