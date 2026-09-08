package com.fixinh.smt.booking;

import jakarta.persistence.Embeddable;

@Embeddable
public class ServiceAddress {
    private String streetNumber;
    private String streetName;
    private String ward;
    private String provinceCode;
    private String provinceName;
    protected ServiceAddress() {}
    public ServiceAddress(String streetNumber, String streetName, String ward, String provinceCode,
            String provinceName) {
        this.streetNumber = streetNumber; this.streetName = streetName;
        this.ward = ward; this.provinceCode = provinceCode; this.provinceName = provinceName;
    }
    public String getStreetNumber() { return streetNumber; }
    public String getStreetName() { return streetName; }
    public String getWard() { return ward; }
    public String getProvinceCode() { return provinceCode; }
    public String getProvinceName() { return provinceName; }
}
