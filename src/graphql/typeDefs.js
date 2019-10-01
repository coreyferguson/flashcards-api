
module.exports = `

  type Query {

    "The user currently authenticated."
    me: User

  }

  type Mutation {

    "Create or update an existing card. Leave the id undefined to create a new card."
    upsertCard(
      userId: String!
      "When id is undefined a new card will be created."
      id: String
      labels: [String]
      sideAText: String
      sideAImageUrl: String
      sideBText: String
      sideBImageUrl: String
      lastTestTime: String
    ): Card

    deleteCard(
      userId: String!
      id: String!
    ): Card

    newPracticeDeck(
      userId: String!
      pageSize: Int
    ): Boolean

  }

  "You know, a user... like... you."
  type User {

    "Primary key for a user. This is the sub defined by OpenID provider."
    sub: ID!

    "Fetch a single card for the given user."
    card(id: String!): Card

    "Collection of cards belonging to this user"
    cards(
      pageSize: Int
      next: String
      label: String
      "Can be 'lastTestTime' or 'creationTime'."
      orderBy: String
    ): CardCollection!

  }

  "A Card. Represents a unit of knowledge a user maintains."
  type Card {
    id: ID!
    user: User
    labels: [String]
    sideAText: String
    sideAImageUrl: String
    sideBText: String
    sideBImageUrl: String
    lastTestTime: String
  }

  type CardCollection {
    next: String
    items: [Card]
  }

`;
