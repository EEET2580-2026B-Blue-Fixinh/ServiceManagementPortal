package com.fixinh.smt.booking;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fixinh.smt.common.ResourceNotFoundException;
import com.fixinh.smt.servicecatalog.RepairService;
import com.fixinh.smt.servicecatalog.RepairServiceRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {
    private final BookingRepository bookings;
    private final RepairServiceRepository services;
    private final BookingService bookingService;

    public BookingController(BookingRepository bookings, RepairServiceRepository services,
            BookingService bookingService) {
        this.bookings = bookings;
        this.services = services;
        this.bookingService = bookingService;
    }

    @PostMapping
    ResponseEntity<CreateBookingResponse> create(@Valid @RequestBody CreateBookingRequest request) {
        var service = services.findById(request.serviceId()).filter(s -> s.isActive())
                .orElseThrow(() -> new ResourceNotFoundException("SERVICE_NOT_FOUND",
                        "Repair service was not found or is inactive."));
        if (request.preferredServiceDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Preferred service date cannot be in the past.");
        }
        if (!request.availableEndTime().isAfter(request.availableStartTime())
                || request.availableStartTime().plusHours(1).isAfter(request.availableEndTime())) {
            throw new IllegalArgumentException(
                    "The available time window must be at least 60 minutes.");
        }
        if (!"SBP".equals(request.originChannel())) {
            throw new IllegalArgumentException(
                    "originChannel must be SBP for integration bookings.");
        }

        var address = request.serviceAddress();
        if ((address.provinceCode() == null || address.provinceCode().isBlank())
                && (address.provinceName() == null || address.provinceName().isBlank())) {
            throw new IllegalArgumentException(
                    "The service address requires a provinceName or provinceCode.");
        }

        var booking = persistWithUniqueReference(request, service);
        var response = new CreateBookingResponse(
                booking.getBookingRef(),
                booking.getStatus(),
                booking.getServiceName(),
                booking.getPreferredServiceDate(),
                booking.getCreatedAt(),
                "Your booking has been created. A receptionist will confirm it shortly.");

        return ResponseEntity
                .created(URI.create("/api/v1/bookings/" + booking.getBookingRef()))
                .body(response);
    }

    private Booking persistWithUniqueReference(CreateBookingRequest request, RepairService service) {
        int firstNumber = ThreadLocalRandom.current().nextInt(1000, 10000);

        for (int offset = 0; offset < 9000; offset++) {
            int number = 1000 + ((firstNumber - 1000 + offset) % 9000);
            String ref = "ORD-" + Year.now().getValue() + "-" + number;
            var address = request.serviceAddress();

            try {
                return bookings.saveAndFlush(new Booking(
                        ref,
                        request.customerId(),
                        request.customerFullName(),
                        service.getServiceId(),
                        service.getServiceName(),
                        request.issueDescription(),
                        request.preferredServiceDate(),
                        request.availableStartTime(),
                        request.availableEndTime(),
                        new ServiceAddress(
                                address.streetNumber(),
                                address.streetName(),
                                address.ward(),
                                address.provinceCode(),
                                address.provinceName()),
                        request.originChannel()));
            } catch (DataIntegrityViolationException exception) {
                if (!bookings.existsById(ref)) {
                    throw exception;
                }
            }
        }

        throw new IllegalStateException("No booking references remain for the current year.");
    }

    @GetMapping
    Map<String, Object> list(@RequestParam(required = false) String customerId,
            @RequestParam(required = false) BookingStatus status) {
        List<BookingResponse> items = bookingService.findBookings(customerId, status)
                .stream()
                .map(BookingResponse::from)
                .toList();

        return Map.of(
                "items", items,
                "page", Map.of(
                        "number", 0,
                        "size", items.size(),
                        "totalElements", items.size(),
                        "totalPages", items.isEmpty() ? 0 : 1));
    }

    @PatchMapping("/{bookingRef}/confirmation")
    BookingResponse confirm(@PathVariable String bookingRef,
            @Valid @RequestBody ConfirmationRequest request) {
        return BookingResponse.from(bookingService.confirmBooking(
                bookingRef,
                request.estimatedServiceFee(),
                request.estimatedDurationMinutes()));
    }

    @PatchMapping("/{bookingRef}/schedule")
    BookingResponse schedule(@PathVariable String bookingRef,
            @Valid @RequestBody ScheduleRequest request) {
        return BookingResponse.from(bookingService.scheduleBooking(
                bookingRef,
                request.scheduledAt(),
                request.technicianIds()));
    }

    @GetMapping("/{bookingRef}")
    BookingResponse one(@PathVariable String bookingRef) {
        return BookingResponse.from(bookings.findById(bookingRef).orElseThrow(() ->
                new ResourceNotFoundException("BOOKING_NOT_FOUND", "Booking not found.")));
    }

    public record AddressRequest(
            @NotBlank String streetNumber,
            @NotBlank String streetName,
            @NotBlank String ward,
            String provinceCode,
            String provinceName) {}

    public record CreateBookingRequest(
            @NotBlank String customerId,
            @NotBlank String customerFullName,
            @NotBlank String serviceId,
            @NotBlank @Size(min = 10, max = 1000) String issueDescription,
            @NotNull LocalDate preferredServiceDate,
            @NotNull LocalTime availableStartTime,
            @NotNull LocalTime availableEndTime,
            @NotNull @Valid AddressRequest serviceAddress,
            @NotBlank String originChannel) {}

    public record ConfirmationRequest(
            @NotNull @Positive Long estimatedServiceFee,
            @NotNull @Positive Integer estimatedDurationMinutes) {}

    public record ScheduleRequest(
            @NotNull @Future LocalDateTime scheduledAt,
            @NotEmpty List<@NotBlank String> technicianIds) {}

    public record CreateBookingResponse(
            String bookingRef,
            BookingStatus status,
            String serviceName,
            LocalDate preferredServiceDate,
            java.time.Instant createdAt,
            String message) {}

    public record AddressResponse(
            String streetNumber,
            String streetName,
            String ward,
            String provinceCode,
            String provinceName) {}

    public record BookingResponse(
            String bookingRef,
            String customerId,
            String customerFullName,
            BookingStatus status,
            String serviceId,
            String serviceName,
            String issueDescription,
            LocalDate preferredServiceDate,
            LocalTime availableStartTime,
            LocalTime availableEndTime,
            Long estimatedServiceFee,
            Integer estimatedDurationMinutes,
            LocalDateTime scheduledAt,
            List<String> technicianNames,
            java.time.Instant createdAt,
            String originChannel,
            AddressResponse serviceAddress) {

        static BookingResponse from(Booking booking) {
            var address = booking.getServiceAddress();
            return new BookingResponse(
                    booking.getBookingRef(),
                    booking.getCustomerId(),
                    booking.getCustomerFullName(),
                    booking.getStatus(),
                    booking.getServiceId(),
                    booking.getServiceName(),
                    booking.getIssueDescription(),
                    booking.getPreferredServiceDate(),
                    booking.getAvailableStartTime(),
                    booking.getAvailableEndTime(),
                    booking.getEstimatedServiceFee(),
                    booking.getEstimatedDurationMinutes(),
                    booking.getScheduledAt(),
                    booking.getTechnicians().stream()
                            .map(technician -> technician.getFullName())
                            .sorted()
                            .toList(),
                    booking.getCreatedAt(),
                    booking.getOriginChannel(),
                    new AddressResponse(
                            address.getStreetNumber(),
                            address.getStreetName(),
                            address.getWard(),
                            address.getProvinceCode(),
                            address.getProvinceName()));
        }
    }
}