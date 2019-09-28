
const upsertCardResolver = require('../cards/graphql/upsertCardResolver');
const userCardResolver = require('../cards/graphql/userCardResolver');
const userCardsResolver = require('../cards/graphql/userCardsResolver');
const usersResolver = require('../users/graphql/usersResolver');

module.exports = {
  Query: {
    me: usersResolver
  },
  Mutation: {
    upsertCard: upsertCardResolver
  },
  User: {
    card: userCardResolver,
    cards: userCardsResolver
  }
};
