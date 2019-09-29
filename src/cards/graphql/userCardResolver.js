
const { logger } = require('logger-for-kibana');
const service = require('../service/cardsService');
const uuid = require('uuid/v4');

module.exports = async (parent, args, context, info) => {
  const timer = logger.startTimer('userCardResolver', uuid());
  try {
    const userId = parent.sub;
    const card = await service.findOne(userId, args.id);
    timer.stop(true);
    return card;
  } catch (err) {
    timer.stop(false);
    throw err;
  }
};
