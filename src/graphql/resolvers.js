
const deleteCardResolver = require('../cards/graphql/deleteCardResolver');
const upsertCardResolver = require('../cards/graphql/upsertCardResolver');
const userCardResolver = require('../cards/graphql/userCardResolver');
const userCardsResolver = require('../cards/graphql/userCardsResolver');
const usersResolver = require('../users/graphql/usersResolver');
const newPracticeDeckResolver = require('../cards/graphql/newPracticeDeckResolver');

module.exports = {
  Query: {
    me: usersResolver
  },
  Mutation: {
    upsertCard: upsertCardResolver,
    deleteCard: deleteCardResolver,
    newPracticeDeck: newPracticeDeckResolver
  },
  User: {
    card: userCardResolver,
    cards: userCardsResolver
  }
};
