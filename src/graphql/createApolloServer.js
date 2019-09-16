
const typeDefsSource = require('./typeDefs');
const resolvers = require('./resolvers');
const logger = require('logger-for-kibana');
const uuidv4 = require('uuid/v4');

module.exports = (ApolloServer, gql, context) => {
  const typeDefs = gql(typeDefsSource);
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ event }) => {
      logger.tid(uuidv4());
      const sub = event.requestContext.authorizer.claims.sub;
      const result = { user: { sub } }
      logger.info('setting context for user', result);
      return result;
    }
  });
};
