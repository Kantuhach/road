package com.ndola.hotspot;

import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DriverService {

    private final DriverRepository repository;

    public DriverService(DriverRepository repository) {
        this.repository = repository;
    }

    public Driver register(Driver driver) {
        return repository.save(driver);
    }

    public Optional<Driver> findByUsername(String username) {
        return repository.findByUsername(username);
    }

    public boolean usernameExists(String username) {
        return repository.existsByUsername(username);
    }
}
