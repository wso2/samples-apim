package org.wso2.carbon.apimgt.certifications.trainoperations;

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
		this.map.put(id, new ScheduleEntry(id, "07:12", "11:20", "Sydney", "Canberra", "Night Train"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new ScheduleEntry(id, "07:40", "18:30", "Sydney", "Melbourne", "Intercity Train"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new ScheduleEntry(id, "14:41", "05:30", "Sydney", "Brisbane", "1 Change. Train+Bus"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new ScheduleEntry(id, "11:41", "14:04", "Sydney", "Newcastle", "Night Train"));
	}

	public List<ScheduleEntry> getAllSchedules() {
		return new ArrayList(this.map.values());
	}

	public ScheduleEntry getSchedule(String id) {
		return (ScheduleEntry) this.map.get(id);
	}

	public ScheduleEntry addScheduleEntry(ScheduleEntry entry) {
		String id = Long.toString(this.counter.incrementAndGet());
		entry.setEntryId(id);
		this.map.put(id, entry);
		return entry;
	}

	public void updateScheduleEntry(ScheduleEntry entry, String id) {
		entry.setEntryId(id);
		this.map.put(id, entry);
	}

	public void deleteScheduleEntry(String id) {
		this.map.remove(id);
	}
}
