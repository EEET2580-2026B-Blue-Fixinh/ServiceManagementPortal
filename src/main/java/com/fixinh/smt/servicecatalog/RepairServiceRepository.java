package com.fixinh.smt.servicecatalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairServiceRepository extends JpaRepository<RepairService, String> {
    List<RepairService> findAllByActiveTrueOrderByServiceName();
    List<RepairService> findAllByOrderByServiceName();
}
