
const usersResolver = require('../users/graphql/usersResolver');
const userCardsResolver = require('../cards/graphql/userCardsResolver');
const upsertCardResolver = require('../cards/graphql/upsertCardResolver');

module.exports = {
  Query: {
    me: usersResolver
  },
  Mutation: {
    upsertCard: upsertCardResolver
  },
  User: {
    cards: userCardsResolver
  }
};
