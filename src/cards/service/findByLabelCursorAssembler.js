
const assembler = require('../../util/service/cursorAssembler');
const { logger } = require('logger-for-kibana');

const toCursor = cards => {
  logger.info('findByLabelCursorAssembler.toCursor');
  if (!cards.LastEvaluatedKey) return;
  if (cards.Items.length === 0) return;
  const last = cards.Items[cards.Items.length-1];
  const id = last.vertex.S.replace('card:', '').split('|')[1];
  return assembler.toCursor(id);
};

const fromCursor = (cursor, userId, label) => {
  logger.info('findByLabelCursorAssembler.fromCursor', { cursor, userId, label });
  if (!cursor) return;
  const id = assembler.fromCursor(cursor);
  return {
    vertex: { S: `card:${userId}|${id}` },
    edge: { S: `label:${label}` }
  }
};

module.exports = { toCursor, fromCursor };
