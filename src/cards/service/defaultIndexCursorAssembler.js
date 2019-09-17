
const cursorAssembler = require('../../graphql/cursorAssembler');

const toCursor = object => {
  const cardId = object.id.S;
  return cursorAssembler.toCursor(cardId);
};

const fromCursor = (userId, cursor) => {
  const cardId = cursorAssembler.fromCursor(cursor);
  return {
    id: { S: cardId },
    userId: { S: userId }
  };
};

module.exports = { toCursor, fromCursor };
