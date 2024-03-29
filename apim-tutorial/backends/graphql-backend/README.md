# TrainSchedule GraphQL server

## Installation

```
cd graphql-backend
npm install
```

## Starting the server

```
npm start
```

The server will run on port 8084. You can change this by editing `server.js`.

## Sample Operation payloads

Query Operation

```
query {
  schedules {
    endTime
    from
    scheduleId
    startTime
    to
    trainType
  }
}

```

Mutate operation

```
mutation {
  updateSchedule(endTime: "10:25", scheduleId: "1000", startTime: "08:20") {
    startTime
    endTime
    from
    to
    trainType
    scheduleId
  }
} 

```

Subscription operation

```
subscription {
  scheduleUpdate(from: "London") {
    endTime
    from
    scheduleId
    startTime
    to
    trainType
  }
}
```