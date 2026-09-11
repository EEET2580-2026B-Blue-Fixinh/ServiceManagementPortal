package com.fixinh.smt.booking;

import com.fixinh.smt.common.ResourceNotFoundException;
import com.fixinh.smt.technician.Technician;
import com.fixinh.smt.technician.TechnicianRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {
    private final BookingRepository bookings;
    private final TechnicianRepository technicians;

    public BookingService(BookingRepository bookings, TechnicianRepository technicians) {
        this.bookings = bookings;
        this.technicians = technicians;
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

    @Transactional
    public Booking confirmBooking(String bookingRef, long estimatedServiceFee,
            int estimatedDurationMinutes) {
        Booking booking = findBooking(bookingRef);
        booking.confirm(estimatedServiceFee, estimatedDurationMinutes);
        return booking;
    }

    @Transactional
    public Booking scheduleBooking(String bookingRef, LocalDateTime scheduledAt,
            List<String> technicianIds) {
        Booking booking = findBooking(bookingRef);
        Set<String> uniqueIds = new LinkedHashSet<>(technicianIds);

        if (uniqueIds.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one technician ID must be provided.");
        }

        List<Technician> foundTechnicians = technicians.findAllById(uniqueIds);
        if (foundTechnicians.size() != uniqueIds.size()) {
            throw new ResourceNotFoundException(
                    "TECHNICIAN_NOT_FOUND",
                    "One or more technicians were not found.");
        }
        if (foundTechnicians.stream().anyMatch(technician -> !technician.isActive())) {
            throw new IllegalArgumentException(
                    "Only active technicians can be assigned.");
        }

        booking.schedule(scheduledAt, new LinkedHashSet<>(foundTechnicians));
        return booking;
    }

    private Booking findBooking(String bookingRef) {
        return bookings.findById(bookingRef).orElseThrow(() ->
                new ResourceNotFoundException("BOOKING_NOT_FOUND", "Booking not found."));
    }
}
