
const { logger } = require('logger-for-kibana');
const service = require('../service/cardsService');
const uuid = require('uuid/v4');

module.exports = async (parent, args, context, info) => {
  const timer = logger.startTimer('userCardsResolver', uuid());
  try {
    const userId = parent.sub;
    let cards;
    if (!args.label) {
      cards = await service.findByUserId(userId, args);
    } else if (args.label && (!args.orderBy || args.orderBy === 'lastTestTime')) {
      cards = await service.findByLabelOrderByLastTestTime(userId, args.label);
    }
    timer.stop(true);
    return cards;
  } catch (err) {
    timer.stop(false);
    throw err;
  }
};
