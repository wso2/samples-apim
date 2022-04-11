import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import cors from 'cors';

import schema from './data/schema';

const PORT = 8080;

const app = express();

app.use('*', cors());
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb'}));

const server = new ApolloServer({ 
  schema, 
  subscriptions: { path: "/graphql" }
});

server.applyMiddleware({ app });

const httpServer = createServer(app);

server.installSubscriptionHandlers(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`);
});
