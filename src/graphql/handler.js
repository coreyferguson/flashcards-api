
const { ApolloServer, gql } = require('apollo-server-lambda');
const createApolloServer = require('./createApolloServer');

exports.graphqlHandler = createApolloServer(ApolloServer, gql).createHandler({
  cors: {
    origin: true,
    credentials: true
  }
});
