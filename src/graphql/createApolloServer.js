
const typeDefsSource = require('./typeDefs');
const resolvers = require('./resolvers');

module.exports = (ApolloServer, gql, context) => {
  const typeDefs = gql(typeDefsSource);
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ event }) => {
      const sub = event.requestContext.authorizer.claims.sub;
      return { user: { sub } };
    }
  });
};
