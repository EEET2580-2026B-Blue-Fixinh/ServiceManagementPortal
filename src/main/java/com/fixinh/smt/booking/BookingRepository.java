package com.fixinh.smt.booking;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    List<Booking> findByCustomerIdAndStatusOrderByCreatedAtDesc(
            String customerId, BookingStatus status);
}
