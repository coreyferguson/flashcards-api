
const usersResolver = require('../users/graphql/usersResolver');

module.exports = {
  Query: {
    me: usersResolver
  }
};
