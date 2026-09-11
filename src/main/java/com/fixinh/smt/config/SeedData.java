package com.fixinh.smt.config;

import com.fixinh.smt.servicecatalog.RepairService;
import com.fixinh.smt.servicecatalog.RepairServiceRepository;
import com.fixinh.smt.technician.Technician;
import com.fixinh.smt.technician.TechnicianRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SeedData {
    @Bean
    CommandLineRunner seedRepairServices(RepairServiceRepository repository) {
        return args -> {
            addIfMissing(repository, new RepairService(
                    "SVC-PLUMB-01", "Plumbing Repair", "Plumbing", 500000, 120, true));
            addIfMissing(repository, new RepairService(
                    "SVC-ELEC-02", "Electrical Repair", "Electrical", 450000, 90, true));
            addIfMissing(repository, new RepairService(
                    "SVC-APPL-03", "Appliance Repair", "Appliances", 400000, 90, true));
            addIfMissing(repository, new RepairService(
                    "SVC-AC-04", "Air Conditioner Repair", "HVAC", 600000, 120, true));
            addIfMissing(repository, new RepairService(
                    "SVC-CARP-05", "Carpentry Repair", "Carpentry", 550000, 120, true));
            addIfMissing(repository, new RepairService(
                    "SVC-PAINT-06", "Home Painting", "Painting", 700000, 180, true));
            addIfMissing(repository, new RepairService(
                    "SVC-ROOF-07", "Roof Repair", "Roofing", 800000, 180, true));
        };
    }

    @Bean
    CommandLineRunner seedTechnicians(TechnicianRepository repository) {
        return args -> {
            addIfMissing(repository,
                    new Technician("TECH-001", "Nguyen Minh Anh", "Electrical", true));
            addIfMissing(repository,
                    new Technician("TECH-002", "Tran Quoc Bao", "Plumbing", true));
            addIfMissing(repository,
                    new Technician("TECH-003", "Le Thu Ha", "HVAC", true));
        };
    }

    private void addIfMissing(RepairServiceRepository repository, RepairService service) {
        if (!repository.existsById(service.getServiceId())) {
            repository.save(service);
        }
    }

    private void addIfMissing(TechnicianRepository repository, Technician technician) {
        if (!repository.existsById(technician.getTechnicianId())) {
            repository.save(technician);
        }
    }
}
