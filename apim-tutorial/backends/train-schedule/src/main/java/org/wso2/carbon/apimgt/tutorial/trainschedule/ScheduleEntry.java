package org.wso2.carbon.apimgt.tutorial.trainschedule;

public class ScheduleEntry {
	private String entryId;
	private String startTime;
	private String endTime;
	private String from;
	private String to;
	private String trainType;
	private String trainId;

	public ScheduleEntry(String entryId, String startTime, String endTime, String from, String to, String trainType, String trainId) {
		this.entryId = entryId;
		this.startTime = startTime;
		this.endTime = endTime;
		this.from = from;
		this.to = to;
		this.trainType = trainType;
		this.trainId = trainId;
	}

	public String getStartTime() {
		return this.startTime;
	}

	public void setStartTime(String startTime) {
		this.startTime = startTime;
	}

	public String getEndTime() {
		return this.endTime;
	}

	public void setEndTime(String endTime) {
		this.endTime = endTime;
	}

	public String getFrom() {
		return this.from;
	}

	public void setFrom(String from) {
		this.from = from;
	}

	public String getTo() {
		return this.to;
	}

	public void setTo(String to) {
		this.to = to;
	}

	public String getTrainType() {
		return this.trainType;
	}

	public void setTrainType(String trainType) {
		this.trainType = trainType;
	}

	public String getTrainId() {
		return trainId;
	}

	public void setTrainId(String trainId) {
		this.trainId = trainId;
	}

	public String getEntryId() {
		return this.entryId;
	}

	public void setEntryId(String entryId) {
		this.entryId = entryId;
	}
}
