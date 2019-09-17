
module.exports = `

  type Query {
    me: User
  }

  type Mutation {
    upsertCard(userId: String!, id: String, deck: String, text: String): Card
  }

  type User {
    sub: ID!
    cards(pageSize: Int, next: String): CardCollection!
  }

  type Card {
    id: ID!
    user: User
    deck: String
    text: String
  }

  type CardCollection {
    next: String
    items: [Card]
  }

`;
