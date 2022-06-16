package org.wso2.carbon.apimgt.certifications.trainoperations;

import java.util.List;

import org.springframework.stereotype.Component;

import com.coxautodev.graphql.tools.GraphQLQueryResolver;

@Component
public class Schedules implements GraphQLQueryResolver {

	ScheduleManager manager = ScheduleManager.getManager();
	public List<ScheduleEntry> getSchedules() {
		return manager.getAllSchedules();
	}

}
