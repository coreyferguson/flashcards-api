
const { logger } = require('logger-for-kibana');
const service = require('../service');
const uuid = require('uuid/v4');

module.exports = async (parent, args, context, info) => {
  const timer = logger.startTimer('upsertCardResolver', uuid());
  try {
    const { userId, id, deck, sideAText, sideAImageUrl, sideBText, sideBImageUrl } = args;
    const card = await service.save({ userId, id, deck, sideAText, sideAImageUrl, sideBText, sideBImageUrl });
    timer.stop(true);
    return card;
  } catch (err) {
    timer.stop(false);
    throw err;
  }
};
