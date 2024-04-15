package org.wso2.carbon.apimgt.tutorial.trainschedule.models.employee;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Address {
    private String streetAddress;
    private String city;
    private String postalCode;

    @JsonProperty("streetAddress")
    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    @JsonProperty("city")
    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    @JsonProperty("postalCode")
    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }
}
