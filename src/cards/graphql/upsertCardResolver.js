
const { logger } = require('logger-for-kibana');
const service = require('../service/cardsService');
const uuid = require('uuid/v4');

module.exports = async (parent, args, context, info) => {
  const timer = logger.startTimer('upsertCardResolver', uuid());
  try {
    const card = await service.save(args);
    if (args.labels) {
      for (let label of args.labels) {
        await service.attachLabel(card.userId, card.id, label);
      }
    }
    timer.stop(true);
    return card;
  } catch (err) {
    timer.stop(false);
    throw err;
  }
};
