package com.fixinh.smt.servicecatalog;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "repair_services")
public class RepairService {
    @Id private String serviceId;
    private String serviceName;
    private String categoryName;
    private long baseServiceFee;
    private int standardDurationMinutes;
    private boolean active;

    protected RepairService() {}
    public RepairService(String serviceId, String serviceName, String categoryName,
            long baseServiceFee, int standardDurationMinutes, boolean active) {
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.categoryName = categoryName;
        this.baseServiceFee = baseServiceFee;
        this.standardDurationMinutes = standardDurationMinutes;
        this.active = active;
    }
    public String getServiceId() { return serviceId; }
    public String getServiceName() { return serviceName; }
    public String getCategoryName() { return categoryName; }
    public long getBaseServiceFee() { return baseServiceFee; }
    public int getStandardDurationMinutes() { return standardDurationMinutes; }
    public boolean isActive() { return active; }
    public void update(String name, String category, long fee, int duration, boolean active) {
        this.serviceName = name; this.categoryName = category; this.baseServiceFee = fee;
        this.standardDurationMinutes = duration; this.active = active;
    }
}
