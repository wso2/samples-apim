
import { makeExecutableSchema } from 'graphql-tools';

import { PubSub, withFilter } from 'graphql-subscriptions';

const pubsub = new PubSub();
const ADDED_NEW_SCHEDULE = 'new_blog_post';
const UPDATED_NEW_SCHEDULE = 'update_blog_post';
let counter = 1002;

const schemaString = `
schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

type Query {
    schedules:[Schedule]
}

type Subscription {
    newSchedule(from: String!) : Schedule!
    scheduleUpdate(from: String) : Schedule!
}

type Mutation {
    addSchedule(from: String!, to: String!, trainType: String!, startTime: String!, endTime: String!) : Schedule!
    updateSchedule(scheduleId: String!, startTime: String!, endTime: String!) : Schedule!
}

type Schedule {
    scheduleId: String!
    startTime: String
    endTime: String
    from: String
    to: String
    trainType: String
}
`;

let trainSchedules = [
  {
    scheduleId: '1000',
    startTime: '08:00',
    endTime : '10:00',
    from: 'London',
    to: 'Heathrow',
    trainType: 'GoGo'
  },
  {
    scheduleId: '1001',
    startTime: '17:00',
    endTime : '18:00',
    from: 'London',
    to: 'Surrey',
    trainType: 'GoGo'
  },
];

let trainScheduleToData = {};
trainSchedules.forEach((schedule) => {
  trainScheduleToData[schedule.scheduleId] = schedule;
});
let updatedSchedule = {};
// function getSchedule(id) {
//   return trainScheduleToData[id];
// }

function getAllSchedules() {
    return trainSchedules;
}

const resolvers = {
  Query: {
    schedules: (_root, _args) => {
      return getAllSchedules()},
    // blogPost: (_root, { id }) => getSchedule(id),
  },
  Mutation: {
    addSchedule: (_root, { startTime, endTime, from, to, trainType }) => {
      let schedule = { scheduleId: counter.toString(), startTime: startTime, endTime: endTime, from: from, to: to, trainType: trainType };
      trainScheduleToData[counter] = schedule;
      trainSchedules.push(schedule);
      pubsub.publish(ADDED_NEW_SCHEDULE, {newSchedule: schedule});
      counter ++;
      return schedule;
    },
    updateSchedule: (_root, { startTime, endTime, scheduleId }) => {
      let oldSchedule = trainScheduleToData[scheduleId];
      updatedSchedule = { scheduleId: scheduleId, startTime: startTime, endTime: endTime, from: oldSchedule.from, to: oldSchedule.to, trainType: oldSchedule.trainType };
      trainScheduleToData[scheduleId] = updatedSchedule;
      trainSchedules = trainSchedules.filter(function(value, _index, _arr){ 
        return value.scheduleId !== scheduleId;
      });
      trainSchedules.push(updatedSchedule);
      pubsub.publish(UPDATED_NEW_SCHEDULE, {scheduleUpdate: updatedSchedule});
      return updatedSchedule;
    },
  },
  Subscription: {
    newSchedule: {
      subscribe: withFilter(
          () => pubsub.asyncIterator(ADDED_NEW_SCHEDULE),
          (payload, variables) => {
              return (payload !== undefined) && 
              ((variables.from === null) || (payload.newSchedule.from === variables.from));
          }
      ),
    },    
    // scheduleUpdate: {
    //   subscribe: withFilter(
    //       () => pubsub.asyncIterator(UPDATED_NEW_SCHEDULE),
    //       (payload, variables) => {
    //           return (payload !== undefined) && 
    //           ((variables.from === null) || (payload.scheduleUpdate.from === variables.from));
    //       }
    //   ),
    // },
    scheduleUpdate:{
      subscribe: () => {
        return pubsub.asyncIterator(UPDATED_NEW_SCHEDULE);
      }
    }, 
  },
}

export const TrainScheduleAppSchema = makeExecutableSchema({
  typeDefs: [schemaString],
  resolvers
});
