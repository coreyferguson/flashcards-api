
module.exports = `

  type Query {

    "The user currently authenticated."
    me: User

  }

  type Mutation {

    "Create or update an existing card. Leave the id undefined to create a new card."
    upsertCard(
      userId: String!,
      "When id is undefined a new card will be created."
      id: String,
      deck: String,
      sideAText: String
      sideAImageUrl: String
      sideBText: String
      sideBImageUrl: String
    ): Card

  }

  "You know, a user... like... you."
  type User {
    "Primary key for a user. This is the sub defined by OpenID provider."
    sub: ID!
    "Collection of cards belonging to this user"
    cards(pageSize: Int, next: String): CardCollection!
  }

  "A Card. Represents a unit of knowledge a user maintains."
  type Card {
    id: ID!
    user: User
    deck: String
    sideAText: String
    sideAImageUrl: String
    sideBText: String
    sideBImageUrl: String
  }

  type CardCollection {
    next: String
    items: [Card]
  }

`;
