package com.fixinh.smt.technician;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "technicians")
public class Technician {
    @Id
    private String technicianId;

    private String fullName;
    private String specialty;
    private boolean active;

    protected Technician() {}

    public Technician(String technicianId, String fullName, String specialty, boolean active) {
        this.technicianId = technicianId;
        this.fullName = fullName;
        this.specialty = specialty;
        this.active = active;
    }

    public String getTechnicianId() { return technicianId; }
    public String getFullName() { return fullName; }
    public String getSpecialty() { return specialty; }
    public boolean isActive() { return active; }
}