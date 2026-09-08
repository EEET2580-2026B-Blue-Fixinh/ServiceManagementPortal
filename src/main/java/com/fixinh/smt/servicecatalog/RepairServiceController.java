package com.fixinh.smt.servicecatalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.fixinh.smt.common.ResourceNotFoundException;

@RestController
@RequestMapping("/api/v1/repair-services")
public class RepairServiceController {
    private final RepairServiceRepository repository;
    public RepairServiceController(RepairServiceRepository repository) { this.repository = repository; }

    @GetMapping
    Map<String, List<RepairServiceDto>> list(@RequestParam(defaultValue = "false") boolean activeOnly) {
        var values = activeOnly ? repository.findAllByActiveTrueOrderByServiceName()
                : repository.findAllByOrderByServiceName();
        return Map.of("items", values.stream().map(RepairServiceDto::from).toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    RepairServiceDto create(@Valid @RequestBody RepairServiceRequest request) {
        var saved = repository.save(new RepairService(request.serviceId(), request.serviceName(),
                request.categoryName(), request.baseServiceFee(), request.standardDurationMinutes(), true));
        return RepairServiceDto.from(saved);
    }

    @PutMapping("/{serviceId}")
    RepairServiceDto update(@PathVariable String serviceId, @Valid @RequestBody RepairServiceRequest request) {
        var service = get(serviceId);
        service.update(request.serviceName(), request.categoryName(), request.baseServiceFee(),
                request.standardDurationMinutes(), request.isActive());
        return RepairServiceDto.from(repository.save(service));
    }

    @PatchMapping("/{serviceId}/status")
    RepairServiceDto status(@PathVariable String serviceId, @RequestBody StatusRequest request) {
        var service = get(serviceId);
        service.update(service.getServiceName(), service.getCategoryName(), service.getBaseServiceFee(),
                service.getStandardDurationMinutes(), request.active());
        return RepairServiceDto.from(repository.save(service));
    }

    private RepairService get(String id) {
        return repository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("SERVICE_NOT_FOUND", "Repair service not found."));
    }

    record RepairServiceRequest(@NotBlank String serviceId, @NotBlank String serviceName,
            @NotBlank String categoryName, @Min(0) long baseServiceFee,
            @Min(15) int standardDurationMinutes, boolean isActive) {}
    record StatusRequest(boolean active) {}
}
