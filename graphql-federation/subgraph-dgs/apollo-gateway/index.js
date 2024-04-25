const {ApolloServer} = require('apollo-server');
const {ApolloGateway} = require('@apollo/gateway')

const gateway = new ApolloGateway({
    serviceList: [
        {name: 'products', url: 'http://localhost:8081/graphql'},
        {name: 'accounts', url: 'http://localhost:8082/graphql'},
        {name: 'reviews', url: 'http://localhost:8083/graphql'},
        {name: 'inventory', url: 'http://localhost:8084/graphql'},
    ]
});

const server = new ApolloServer({
    gateway,
    subscriptions: false,
    tracing: true
});

console.log(gateway);

server.listen({port: 8080}).then(({url}) => {
    console.log(`🚀 Gateway ready at ${url}`);
}).catch(err => {
    console.error(err)
});