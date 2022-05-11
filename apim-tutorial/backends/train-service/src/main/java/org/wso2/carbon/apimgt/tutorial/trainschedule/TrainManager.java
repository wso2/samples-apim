package org.wso2.carbon.apimgt.tutorial.trainschedule;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class TrainManager {
	private final AtomicLong counter = new AtomicLong();
	private Map<String, TrainEntry> map = new ConcurrentHashMap();
	
	private static TrainManager manager = null;
	
	public static TrainManager getManager() {
		if (manager == null) {
			manager = new TrainManager();
		}
		return manager;
	}

	private TrainManager() {
		String id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new TrainEntry(id, 7, "https://abc.train.org/resources/image/0931.png",
				"Heavier", "Canteen"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new TrainEntry(id, 12, "https://abc.train.org/resources/image/19234.png",
				"Heavier", "WiFi, Canteen"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new TrainEntry(id, 8, "https://abc.train.org/resources/image/7853.png",
				"TigerJet", "Canteen"));
		id = Long.toString(this.counter.incrementAndGet());
		this.map.put(id, new TrainEntry(id, 10, "https://abc.train.org/resources/image/8096.png",
				"TigerJet", "WiFi, Canteen"));
	}

	public List<TrainEntry> getAllTrains() {
		return new ArrayList(this.map.values());
	}

	public TrainEntry getTrain(String id) {
		return (TrainEntry) this.map.get(id);
	}

	public void addTrain(TrainEntry entry) {
		String id = Long.toString(this.counter.incrementAndGet());
		entry.setTrainId(id);
		this.map.put(id, entry);
	}

	public void updateTrain(TrainEntry entry, String id) {
		entry.setTrainId(id);
		this.map.put(id, entry);
	}

	public void deleteTrain(String id) {
		this.map.remove(id);
	}
}
