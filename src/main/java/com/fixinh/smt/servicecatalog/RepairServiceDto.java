package com.fixinh.smt.servicecatalog;

public record RepairServiceDto(String serviceId, String serviceName, String categoryName,
        long baseServiceFee, int standardDurationMinutes, boolean isActive) {
    static RepairServiceDto from(RepairService value) {
        return new RepairServiceDto(value.getServiceId(), value.getServiceName(), value.getCategoryName(),
                value.getBaseServiceFee(), value.getStandardDurationMinutes(), value.isActive());
    }
}
