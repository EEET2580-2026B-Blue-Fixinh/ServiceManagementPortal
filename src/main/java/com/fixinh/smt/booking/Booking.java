package com.fixinh.smt.booking;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.data.domain.Persistable;

import com.fixinh.smt.technician.Technician;

import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "bookings")
public class Booking implements Persistable<String> {
    @Id
    private String bookingRef;

    @Transient
    private boolean newEntity = true;

    private String customerId;
    private String customerFullName;
    private String serviceId;
    private String serviceName;
    private String issueDescription;
    private LocalDate preferredServiceDate;
    private LocalTime availableStartTime;
    private LocalTime availableEndTime;

    @Embedded
    private ServiceAddress serviceAddress;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private Long estimatedServiceFee;
    private Integer estimatedDurationMinutes;
    private LocalDateTime scheduledAt;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "booking_technicians",
            joinColumns = @JoinColumn(name = "booking_ref"),
            inverseJoinColumns = @JoinColumn(name = "technician_id"))
    private Set<Technician> technicians = new LinkedHashSet<>();

    private Instant createdAt;
    private String originChannel;

    protected Booking() {}

    public Booking(String bookingRef, String customerId, String customerFullName,
            String serviceId, String serviceName, String issueDescription,
            LocalDate preferredServiceDate, LocalTime availableStartTime,
            LocalTime availableEndTime, ServiceAddress serviceAddress, String originChannel) {
        this.bookingRef = bookingRef;
        this.customerId = customerId;
        this.customerFullName = customerFullName;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.issueDescription = issueDescription;
        this.preferredServiceDate = preferredServiceDate;
        this.availableStartTime = availableStartTime;
        this.availableEndTime = availableEndTime;
        this.serviceAddress = serviceAddress;
        this.status = BookingStatus.CREATED;
        this.createdAt = Instant.now();
        this.originChannel = originChannel;
    }

    public String getBookingRef() { return bookingRef; }

    @Override
    public String getId() { return bookingRef; }

    @Override
    public boolean isNew() { return newEntity; }

    @PostPersist
    @PostLoad
    void markNotNew() { newEntity = false; }

    public String getCustomerId() { return customerId; }
    public String getCustomerFullName() { return customerFullName; }
    public String getServiceId() { return serviceId; }
    public String getServiceName() { return serviceName; }
    public String getIssueDescription() { return issueDescription; }
    public LocalDate getPreferredServiceDate() { return preferredServiceDate; }
    public LocalTime getAvailableStartTime() { return availableStartTime; }
    public LocalTime getAvailableEndTime() { return availableEndTime; }
    public ServiceAddress getServiceAddress() { return serviceAddress; }
    public BookingStatus getStatus() { return status; }
    public Long getEstimatedServiceFee() { return estimatedServiceFee; }
    public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public Set<Technician> getTechnicians() { return Set.copyOf(technicians); }
    public Instant getCreatedAt() { return createdAt; }
    public String getOriginChannel() { return originChannel; }

    public void confirm(long estimatedServiceFee, int estimatedDurationMinutes) {
        if (status != BookingStatus.CREATED) {
            throw new IllegalArgumentException(
                    "Only bookings with CREATED status can be confirmed.");
        }
        this.estimatedServiceFee = estimatedServiceFee;
        this.estimatedDurationMinutes = estimatedDurationMinutes;
        this.status = BookingStatus.CONFIRMED;
    }

    public void schedule(LocalDateTime scheduledAt, Set<Technician> technicians) {
        if (status != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Only bookings with CONFIRMED status can be scheduled.");
        }
        if (technicians.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one active technician must be assigned.");
        }
        this.scheduledAt = scheduledAt;
        this.technicians.clear();
        this.technicians.addAll(technicians);
        this.status = BookingStatus.SCHEDULED;
    }
}