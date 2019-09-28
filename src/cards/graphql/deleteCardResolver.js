
const { logger } = require('logger-for-kibana');
const service = require('../service/cardsService');
const uuid = require('uuid/v4');

module.exports = async (parent, args, context, info) => {
  const timer = logger.startTimer('deleteCardResolver', uuid());
  try {
    await service.delete(args.userId, args.id);
    timer.stop(true);
    return args;
  } catch (err) {
    timer.stop(false);
    throw err;
  }
};
