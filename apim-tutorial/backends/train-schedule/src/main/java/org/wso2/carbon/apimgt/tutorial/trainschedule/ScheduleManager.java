package org.wso2.carbon.apimgt.tutorial.trainschedule;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class ScheduleManager {
	private final AtomicLong counter = new AtomicLong();
	private Map<String, ScheduleEntry> map = new ConcurrentHashMap();
	
	private static ScheduleManager manager = null;
	
	public static ScheduleManager getManager() {
		if (manager == null) {
			manager = new ScheduleManager();
		}
		return manager;
	}

	private ScheduleManager() {
		String id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new ScheduleEntry(id, "14:50", "19:59", "London", "Glasgow", "Standard"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new ScheduleEntry(id, "14:30", "19:20", "London", "Edinburgh", "1st class"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new ScheduleEntry(id, "11:10", "12:59", "London", "Cardiff", "Standard"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new ScheduleEntry(id, "08:30", "10:50", "London", "Manchester", "1st class"));
	}

	public List<ScheduleEntry> getAllSchedules() {
		return new ArrayList(this.map.values());
	}

	public ScheduleEntry getSchedule(String id) {
		return (ScheduleEntry) this.map.get(id);
	}

	public void addScheduleEntry(ScheduleEntry entry) {
		String id = Long.toString(this.counter.incrementAndGet());
		entry.setEntryId(id);
		this.map.put(id, entry);
	}

	public void updateScheduleEntry(ScheduleEntry entry, String id) {
		entry.setEntryId(id);
		this.map.put(id, entry);
	}

	public void deleteScheduleEntry(String id) {
		this.map.remove(id);
	}
}
