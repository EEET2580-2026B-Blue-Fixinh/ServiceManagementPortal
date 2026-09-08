package com.fixinh.smt.config;

import com.fixinh.smt.servicecatalog.RepairService;
import com.fixinh.smt.servicecatalog.RepairServiceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SeedData {
    @Bean
    CommandLineRunner seedRepairServices(RepairServiceRepository repository) {
        return args -> {
            if (repository.count() > 0) return;
            repository.save(new RepairService("SVC-PLUMB-01", "Plumbing Repair", "Plumbing", 500000, 120, true));
            repository.save(new RepairService("SVC-ELEC-02", "Electrical Repair", "Electrical", 450000, 90, true));
            repository.save(new RepairService("SVC-APPL-03", "Appliance Repair", "Appliances", 400000, 90, true));
        };
    }
}
