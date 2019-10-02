
const service = require('../service/cardsService');
const uuid = require('uuid/v4');
const { logger } = require('logger-for-kibana');

module.exports = async (parent, args, context, info) => {
  const timer = logger.startTimer('newPracticeDeckResolver', uuid());
  try {
    const cards = await service.newPracticeSession(args.userId, { pageSize: args.pageSize });
    timer.stop(true);
    return cards;
  } catch (err) {
    timer.stop(false);
    throw err;
  }
};
