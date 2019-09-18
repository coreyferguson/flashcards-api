
const assembler = require('../../util/service/cursorAssembler');

const toCursor = cards => {
  if (!cards.LastEvaluatedKey) return;
  if (cards.Items.length === 0) return;
  const last = cards.Items[cards.Items.length-1];
  return assembler.toCursor(last.UserIdIndex_id.S);
};

const fromCursor = (cursor, userId) => {
  if (!cursor) return;
  const id = assembler.fromCursor(cursor);
  return {
    edge: { S: `card:${userId}|${id}` },
    UserIdIndex_id: { S: id },
    UserIdIndex_userId: { S: userId },
    vertex: { S: `card:${userId}|${id}` },
  };
};

module.exports = { toCursor, fromCursor };
