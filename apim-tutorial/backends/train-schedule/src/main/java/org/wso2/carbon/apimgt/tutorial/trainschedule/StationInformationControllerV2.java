package org.wso2.carbon.apimgt.tutorial.trainschedule;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.Platform;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.Station;
import org.wso2.carbon.apimgt.tutorial.trainschedule.models.TrainV2;

import java.util.List;

@RestController
@RequestMapping("/v2")
public class StationInformationControllerV2 {

    StationInformationManagerV2 manager = new StationInformationManagerV2();

    // GET /stations
    @GetMapping("/stations")
    public ResponseEntity<List<Station>> getAllStations() {
        List<Station> stations = manager.getStations();
        return ResponseEntity.ok(stations);
    }

    // POST /stations
    @PostMapping("/stations")
    public ResponseEntity<Station> createStation(@RequestBody Station station) {
        manager.addStation(station);
        return ResponseEntity.status(HttpStatus.CREATED).body(station);
    }

    // GET /stations/{station_id}
    @GetMapping("/stations/{station_id}")
    public ResponseEntity<Station> getStationById(@PathVariable("station_id") String stationId) {
        List<Station> stations = manager.getStations();
        for (Station station : stations) {
            if (station.getId().equals(stationId)) {
                return ResponseEntity.ok(station);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // PUT /stations/{station_id}
    @PutMapping("/stations/{station_id}")
    public ResponseEntity<Station> updateStation(@PathVariable("station_id") String stationId,
            @RequestBody Station updatedStation) {
        boolean status = manager.updateStation(stationId, updatedStation);
        if (status) {
            return ResponseEntity.ok(updatedStation);
        } else {
            return ResponseEntity.notFound().build();
        }

    }

    // GET /stations/{station_id}/platforms
    @GetMapping("/stations/{station_id}/platforms")
    public ResponseEntity<List<Platform>> getPlatformsForStation(@PathVariable("station_id") String stationId) {
        List<Platform> stationPlatforms = manager.getPlatforms(stationId);
        return ResponseEntity.ok(stationPlatforms);
    }

    // POST /stations/{station_id}/platforms
    @PostMapping("/stations/{station_id}/platforms")
    public ResponseEntity<Platform> createPlatform(@PathVariable("station_id") String stationId,
            @RequestBody Platform platform) {
        
        boolean status = manager.addPlatform(stationId, platform);
        if (status) {
            return ResponseEntity.status(HttpStatus.CREATED).body(platform);
        } else {
            return ResponseEntity.notFound().build();
        }
        
    }

    // GET /stations/{station_id}/trains
    @GetMapping("/stations/{station_id}/trains")
    public ResponseEntity<List<TrainV2>> getTrainsForStation(@PathVariable("station_id") String stationId) {
        
        List<TrainV2> stationTrains = manager.getTrains(stationId);
        return ResponseEntity.ok(stationTrains);
    }

    // POST /stations/{station_id}/trains
    @PostMapping("/stations/{station_id}/trains")
    public ResponseEntity<TrainV2> createTrain(@PathVariable("station_id") String stationId, @RequestBody TrainV2 train) {

        boolean status = manager.addTrain(stationId, train);
        if (status) {
            return ResponseEntity.status(HttpStatus.CREATED).body(train);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
