
const typeDefsSource = require('./typeDefs');
const resolvers = require('./resolvers');

module.exports = (ApolloServer, gql, context) => {
  const typeDefs = gql(typeDefsSource);
  return new ApolloServer({
    typeDefs,
    resolvers
  });
};
