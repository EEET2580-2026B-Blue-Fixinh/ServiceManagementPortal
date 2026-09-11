package com.fixinh.smt.booking;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {
    private final BookingRepository bookings;

    public BookingService(BookingRepository bookings) {
        this.bookings = bookings;
    }

    public List<Booking> findBookings(String customerId, BookingStatus status) {
        boolean hasCustomerId = customerId != null && !customerId.isBlank();

        if (hasCustomerId && status != null) {
            return bookings.findByCustomerIdAndStatusOrderByCreatedAtDesc(customerId, status);
        }
        if (hasCustomerId) {
            return bookings.findByCustomerIdOrderByCreatedAtDesc(customerId);
        }
        if (status != null) {
            return bookings.findByStatusOrderByCreatedAtDesc(status);
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Provide at least one booking filter: customerId or status.");
    }
}