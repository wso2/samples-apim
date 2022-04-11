package org.wso2.carbon.apimgt.tutorial.trainschedule;

public class Count {
	private int count;
	private String time;
	
	public Count(int count, String time) {
		super();
		this.count = count;
		this.time = time;
	}
	public int getCount() {
		return count;
	}
	public void setCount(int count) {
		this.count = count;
	}
	public String getTime() {
		return time;
	}
	public void setTime(String time) {
		this.time = time;
	}

	
}
