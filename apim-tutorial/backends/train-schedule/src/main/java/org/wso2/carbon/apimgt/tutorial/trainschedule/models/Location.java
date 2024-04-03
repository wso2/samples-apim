package org.wso2.carbon.apimgt.tutorial.trainschedule.models;

public class Location {
    public Location(double latitude, double longitude) {
        super();
        this.latitude = latitude;
        this.longitude = longitude;
    }
    private double latitude;
    private double longitude;
    
    
    public double getLatitude() {
        return latitude;
    }
    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }
    public double getLongitude() {
        return longitude;
    }
    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }
    
}
