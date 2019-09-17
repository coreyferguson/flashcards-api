
process.env.stage = 'dev';
process.env.cardsTableName = 'flash-api-cards-dev';
const sub = process.env.sub || 'd11e8549-945a-4178-bd70-0c9593f95c8f';

const { ApolloServer, gql } = require('apollo-server');
const createApolloServer = require('../../src/graphql/createApolloServer');

const context = () => {
  return { user: { sub } };
};

createApolloServer(ApolloServer, gql, context).listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
