package org.wso2.carbon.apimgt.tutorial.trainschedule;

public class TrainEntry {
	private String trainId;
	private Integer numberOfCarriage;
	private String imageURL;
	private String engineModel;
	private String facilities;

	public TrainEntry(String trainId, Integer numberOfCarriage, String imageURL, String engineModel, String facilities) {
		this.trainId = trainId;
		this.numberOfCarriage = numberOfCarriage;
		this.imageURL = imageURL;
		this.engineModel = engineModel;
		this.facilities = facilities;
	}

	public Integer getNumberOfCarriage() {
		return numberOfCarriage;
	}

	public void setNumberOfCarriage(Integer numberOfCarriage) {
		this.numberOfCarriage = numberOfCarriage;
	}

	public String getImageURL() {
		return this.imageURL;
	}

	public void setImageURL(String imageURL) {
		this.imageURL = imageURL;
	}

	public String getEngineModel() {
		return this.engineModel;
	}

	public void setEngineModel(String engineModel) {
		this.engineModel = engineModel;
	}

	public String getFacilities() {
		return this.facilities;
	}

	public void setFacilities(String facilities) {
		this.facilities = facilities;
	}

	public String getTrainId() {
		return this.trainId;
	}

	public void setTrainId(String trainId) {
		this.trainId = trainId;
	}
}
