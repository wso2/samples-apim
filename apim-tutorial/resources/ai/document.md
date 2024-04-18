# StationInformation API

## Description
This API provides comprehensive information about train stations, including details about stations themselves, platforms within stations, and trains arriving and departing from these stations.

## Base URL
- Production server: [http://backend-service:8080/train-operations/v1/](http://backend-service:8080/train-operations/v1/)

## Paths

### Retrieve all stations
- **Method:** GET
- **Endpoint:** `/stations`
- **Summary:** Retrieve all stations
- **Description:** Retrieves a list of all train stations available in the system.
- **Response:** 
  - Status Code: 200
  - Content Type: application/json
  - Schema: [Station](#station-schema)

### Create a new station
- **Method:** POST
- **Endpoint:** `/stations`
- **Summary:** Create a new station
- **Description:** Creates a new train station with the provided details.
- **Request Body:** [Station](#station-schema)
- **Response:** 
  - Status Code: 201
  - Content Type: application/json
  - Schema: [Station](#station-schema)

### Retrieve station by ID
- **Method:** GET
- **Endpoint:** `/stations/{station_id}`
- **Parameters:**
  - `{station_id}` (path): ID of the station to retrieve
- **Summary:** Retrieve station by ID
- **Description:** Retrieves details of a specific train station identified by its unique ID.
- **Response:** 
  - Status Code: 200
  - Content Type: application/json
  - Schema: [Station](#station-schema)

### Update station information
- **Method:** PUT
- **Endpoint:** `/stations/{station_id}`
- **Parameters:**
  - `{station_id}` (path): ID of the station to update
- **Summary:** Update station information
- **Description:** Updates the information of a train station with the provided details.
- **Request Body:** [Station](#station-schema)
- **Response:** 
  - Status Code: 200
  - Content Type: application/json
  - Schema: [Station](#station-schema)

### Retrieve platforms for a station
- **Method:** GET
- **Endpoint:** `/stations/{station_id}/platforms`
- **Parameters:**
  - `{station_id}` (path): ID of the station to retrieve platforms for
- **Summary:** Retrieve platforms for a station
- **Description:** Retrieves information about platforms available at a specific train station.
- **Response:** 
  - Status Code: 200
  - Content Type: application/json
  - Schema: [Platform](#platform-schema)

### Create a new platform for the station
- **Method:** POST
- **Endpoint:** `/stations/{station_id}/platforms`
- **Parameters:**
  - `{station_id}` (path): ID of the station to create a platform for
- **Summary:** Create a new platform for the station
- **Description:** Creates a new platform within a train station with the provided details.
- **Request Body:** [Platform](#platform-schema)
- **Response:** 
  - Status Code: 201
  - Content Type: application/json
  - Schema: [Platform](#platform-schema)

### Retrieve trains at a station
- **Method:** GET
- **Endpoint:** `/stations/{station_id}/trains`
- **Parameters:**
  - `{station_id}` (path): ID of the station to retrieve trains for
- **Summary:** Retrieve trains at a station
- **Description:** Retrieves information about trains arriving or departing from a specific train station.
- **Response:** 
  - Status Code: 200
  - Content Type: application/json
  - Schema: [Train](#train-schema)

### Create a new train at the station
- **Method:** POST
- **Endpoint:** `/stations/{station_id}/trains`
- **Parameters:**
  - `{station_id}` (path): ID of the station to create a train for
- **Summary:** Create a new train at the station
- **Description:** Creates a new train arriving or departing from a specific train station with the provided details.
- **Request Body:** [Train](#train-schema)
- **Response:** 
  - Status Code: 201
  - Content Type: application/json
  - Schema: [Train](#train-schema)

## Schemas

### Station Schema
```json
{
  "id": "string",
  "name": "string",
  "location": {
    "latitude": "number",
    "longitude": "number"
  },
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "country": "string"
  }
}
```

### Platform Schema
```json
{
  "id": "string",
  "name": "string",
  "capacity": "integer"
}
```

### Train Schema
```json
{
  "id": "string",
  "name": "string",
  "arrival_time": "string (date-time)",
  "departure_time": "string (date-time)",
  "owner_company": "string"
}
```