
const { logger } = require('logger-for-kibana');
const service = require('../service');

module.exports = async (parent, args, context, info) => {
  logger.info('upsertCardResolver');
  const { userId, id, deck, text } = args;
  const card = await service.save({ userId, id, deck, text });
  return card;
};
