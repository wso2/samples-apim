package org.wso2.carbon.apimgt.tutorial.soapservice;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Component;
import org.tenet.metrics.Breakdown;
import org.tenet.metrics.Summary;

@Component
public class ItemRepository {
	private Summary metrics = new Summary();

	@PostConstruct
	public void initData() {
		addMetrics();
	}

	private void addMetrics() {
		Breakdown firstClass = new Breakdown();
		firstClass.setClazz("1st");
		firstClass.setValue("59");

		Breakdown secondClass = new Breakdown();
		secondClass.setClazz("2nd");
		secondClass.setValue("91");

		Breakdown thirdClass = new Breakdown();
		thirdClass.setClazz("3rd");
		thirdClass.setValue("107");

		metrics.getBreakdown().add(firstClass);
		metrics.getBreakdown().add(secondClass);
		metrics.getBreakdown().add(thirdClass);
		metrics.setTotal("257");
	}

	Summary getSummary() {
		return metrics;
	}
}
