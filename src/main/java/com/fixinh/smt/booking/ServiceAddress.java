package com.fixinh.smt.booking;

import jakarta.persistence.Embeddable;

@Embeddable
public class ServiceAddress {
    private String streetNumber;
    private String streetName;
    private String ward;
    private String provinceCode;
    protected ServiceAddress() {}
    public ServiceAddress(String streetNumber, String streetName, String ward, String provinceCode) {
        this.streetNumber = streetNumber; this.streetName = streetName;
        this.ward = ward; this.provinceCode = provinceCode;
    }
    public String getStreetNumber() { return streetNumber; }
    public String getStreetName() { return streetName; }
    public String getWard() { return ward; }
    public String getProvinceCode() { return provinceCode; }
}
