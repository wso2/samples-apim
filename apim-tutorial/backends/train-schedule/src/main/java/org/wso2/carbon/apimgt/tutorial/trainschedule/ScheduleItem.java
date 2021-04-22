package org.wso2.carbon.apimgt.tutorial.trainschedule;

public class ScheduleItem {
	private String arrivalTime;
	private String departureTime;
	private String compartmentType;

	public String getArrivalTime() {
		return this.arrivalTime;
	}

	public void setArrivalTime(String arrivalTime) {
		this.arrivalTime = arrivalTime;
	}

	public String getDepartureTime() {
		return this.departureTime;
	}

	public void setDepartureTime(String departureTime) {
		this.departureTime = departureTime;
	}

	public String getCompartmentType() {
		return this.compartmentType;
	}

	public void setCompartmentType(String compartmentType) {
		this.compartmentType = compartmentType;
	}
}
