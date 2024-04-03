package org.wso2.carbon.apimgt.tutorial.trainschedule;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.wso2.carbon.apimgt.tutorial.trainschedule.models.Platform;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.Station;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.Train;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.Location;
import org.springframework.http.ResponseEntity;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.Address;

public class StationInformationManager {

    Random random = new Random();
    private List<Station> stations = new ArrayList<>();
    private Map<String, List<Platform>> platforms = new HashMap<String, List<Platform>>();
    private Map<String, List<Train>> trains = new HashMap<String, List<Train>>();
    private int stationId = 1100;

    
    public StationInformationManager() {
        Station station = new Station();
        station.setId(Integer.toString(stationId));
        station.setName("Waterloo");
        station.setLocation(new Location(51.50337682825442, -0.1122286269853001));
        station.setAddress(new Address("Waterloo Rd.", "London", "SE1 8SW" , "United Kingdom"));
        stations.add(station);  
        platforms.put(Integer.toString(stationId), generatePlatforms(24));
        trains.put(Integer.toString(stationId), generateTrains(10));
        
        stationId ++;
        
        station = new Station();
        station.setId(Integer.toString(stationId));
        station.setName("King's Cross");
        station.setLocation(new Location(51.50337682825442, -0.1122286269853001));
        station.setAddress(new Address("Euston Rd.", "London", "N1 9AL" , "United Kingdom"));
        stations.add(station);
        platforms.put(Integer.toString(stationId), generatePlatforms(11));
        trains.put(Integer.toString(stationId), generateTrains(10));
        
        stationId ++;
        
        //Manchester -  , ,  and 
        station = new Station();
        station.setId(Integer.toString(stationId));
        station.setName("Manchester Piccadilly");
        station.setLocation(new Location(53.477483644073594, -2.231145242328433));
        station.setAddress(new Address("Piccadilly Station Approach, Greater", "Manchester", "M60 7RA" , "United Kingdom"));
        stations.add(station);
        platforms.put(Integer.toString(stationId), generatePlatforms(5));
        trains.put(Integer.toString(stationId), generateTrains(6));
        
        stationId ++;
        
        station = new Station();
        station.setId(Integer.toString(stationId));
        station.setName("Manchester Victoria");
        station.setLocation(new Location(53.477483644073594, -2.231145242328433));
        station.setAddress(new Address("Victoria Station Approach", "Manchester", "M99 1ZW" , "United Kingdom"));
        stations.add(station);
        platforms.put(Integer.toString(stationId), generatePlatforms(6));
        trains.put(Integer.toString(stationId), generateTrains(7));
        
        stationId ++;

        station = new Station();
        station.setId(Integer.toString(stationId));
        station.setName("Manchester Oxford Road");
        station.setLocation(new Location(53.477483644073594, -2.231145242328433));
        station.setAddress(new Address("Victoria Station Approach", "Manchester", "M99 1ZW" , "United Kingdom"));
        stations.add(station);
        platforms.put(Integer.toString(stationId), generatePlatforms(6));
        trains.put(Integer.toString(stationId), generateTrains(7));
         
        stationId ++;
        
        station = new Station();
        station.setId(Integer.toString(stationId));
        station.setName("Manchester Deansgate");
        station.setLocation(new Location(53.477483644073594, -2.231145242328433));
        station.setAddress(new Address("Victoria Station Approach", "Manchester", "M99 1ZW" , "United Kingdom"));
        stations.add(station);
        platforms.put(Integer.toString(stationId), generatePlatforms(6));
        trains.put(Integer.toString(stationId), generateTrains(7));
         
        stationId ++;
    }


    private List<Platform> generatePlatforms(int count) {
        // Add platforms
        List<Platform> temp = new ArrayList<Platform>();
        for(int i = 1; i <= count; i++ ) {
            Platform platform = new Platform();
            platform.setId(Integer.toString(i));
            platform.setName("Platform " + i);
            platform.setCapacity(1000 + random.nextInt(500));
            temp.add(platform);
            
        }
        return temp;
    }


    private List<Train> generateTrains(int count) {
        List<Train> tempTrains = new ArrayList<Train>();
        for(int i = 1; i <= count; i++ ) {
            Train train = new Train();
            train.setId("train-" + i);
            train.setName("Train " + i);
            train.setArrival_time(LocalDateTime.now().plusHours(i));
            train.setDeparture_time(LocalDateTime.now().plusHours(i + 1));
            switch (i % 3) {
                case 0:
                    train.setOwner_company("Quantis");
                    break;
                case 1:
                    train.setOwner_company("Coltrain");
                    break;
                case 2:
                    train.setOwner_company("Railco");
                    break;
            }
            tempTrains.add(train);
        }
        return tempTrains;
    }


    public List<Station> getStations() {
        return stations;
        
    }


    public void addStation(Station station) {
        station.setId(Integer.toString(stationId++));
        stations.add(station);

    }


    public boolean updateStation(String stationId, Station updatedStation) {
        for (int i = 0; i < stations.size(); i++) {
            Station station = stations.get(i);
            if (station.getId().equals(stationId)) {
                stations.set(i, updatedStation);
                return true;
            }
        }
        return false;
    }


    public List<Platform> getPlatforms(String stationId) {
        return platforms.get(stationId);
    }


    public boolean addPlatform(String stationId, Platform platform) {
        if (platforms.containsKey(stationId)) {
            platforms.get(stationId).add(platform);
            return true;
        }
        return false;
    }


    public List<Train> getTrains(String stationId) {        
        return trains.get(stationId);
    }
    
    public boolean addTrain(String stationId, Train train) {
        if (trains.containsKey(stationId)) {
            trains.get(stationId).add(train);
            return true;
        }
        return false;
    }
}
