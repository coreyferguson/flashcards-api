
const { logger } = require('logger-for-kibana');

class LabelAssembler {

  constructor(options) {
    options = options || {};
    this._logger = options.logger || logger;
  }

  toEntity(model, label) {
    this._logger.info('LabelAssembler.toEntity', { modelId: model.id, label });
    const entity = {};
    entity.vertex = { S: `card:${model.userId}|${model.id}` };
    entity.edge = { S: `label:${label}` };
    if (model.lastTestTime) entity.lastTestTime = { S: model.lastTestTime };
    entity.LabelAndTestTimeIndex_userId_lastTestTime_id = { S: model.LabelAndTestTimeIndex_userId_lastTestTime_id };
    return entity;
  }

}

module.exports = new LabelAssembler();
module.exports.LabelAssembler = LabelAssembler;
