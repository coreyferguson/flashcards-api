
const typeDefsSource = require('./typeDefs');
const resolvers = require('./resolvers');
const { logger } = require('logger-for-kibana');
const uuidv4 = require('uuid/v4');

module.exports = (ApolloServer, gql, context) => {
  const typeDefs = gql(typeDefsSource);
  if (context === undefined) {
    context = ({ event }) => {
      logger.tid(uuidv4());
      const sub = event.requestContext.authorizer.claims.sub;
      const result = { user: { sub } }
      logger.info('CreateApolloServer, setting context for user', result);
      return result;
    };
  }
  return new ApolloServer({
    typeDefs,
    resolvers,
    context
  });
};
