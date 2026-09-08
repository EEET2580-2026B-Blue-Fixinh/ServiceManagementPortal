package com.fixinh.smt.booking;

import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id private String bookingRef;
    private String customerId;
    private String customerFullName;
    private String serviceId;
    private String serviceName;
    private String issueDescription;
    private LocalDate preferredServiceDate;
    private LocalTime availableStartTime;
    private LocalTime availableEndTime;
    @Embedded private ServiceAddress serviceAddress;
    @Enumerated(EnumType.STRING) private BookingStatus status;
    private Instant createdAt;
    private String originChannel;

    protected Booking() {}
    public Booking(String bookingRef, String customerId, String customerFullName,
            String serviceId, String serviceName,
            String issueDescription, LocalDate preferredServiceDate, LocalTime availableStartTime,
            LocalTime availableEndTime, ServiceAddress serviceAddress, String originChannel) {
        this.bookingRef = bookingRef; this.customerId = customerId; this.serviceId = serviceId;
        this.customerFullName = customerFullName;
        this.serviceName = serviceName; this.issueDescription = issueDescription;
        this.preferredServiceDate = preferredServiceDate; this.availableStartTime = availableStartTime;
        this.availableEndTime = availableEndTime; this.serviceAddress = serviceAddress;
        this.status = BookingStatus.CREATED; this.createdAt = Instant.now();
        this.originChannel = originChannel;
    }
    public String getBookingRef() { return bookingRef; }
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
    public Instant getCreatedAt() { return createdAt; }
    public String getOriginChannel() { return originChannel; }
}
