
const { logger } = require('logger-for-kibana');
const service = require('../service');

module.exports = async (parent, args, context, info) => {
  const userId = parent.sub;
  return service.findByUserId(userId, args);
};
