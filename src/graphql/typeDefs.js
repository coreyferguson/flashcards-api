
module.exports = `
  type Query {
    me: User
  }
  type User {
    sub: ID!
  }
`;
