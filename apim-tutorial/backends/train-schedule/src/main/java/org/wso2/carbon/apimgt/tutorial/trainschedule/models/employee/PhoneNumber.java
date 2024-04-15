package org.wso2.carbon.apimgt.tutorial.trainschedule.models.employee;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PhoneNumber {
    private String phoneType;
    private String number;

    @JsonProperty("phoneType")
    public String getPhoneType() {
        return phoneType;
    }

    public void setPhoneType(String phoneType) {
        this.phoneType = phoneType;
    }

    @JsonProperty("number")
    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }
}
