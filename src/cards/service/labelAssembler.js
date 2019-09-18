
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
    if (model.sideAText) entity.sideAText = { S: model.sideAText };
    if (model.sideAImageUrl) entity.sideAImageUrl = { S: model.sideAImageUrl };
    if (model.sideBText) entity.sideBText = { S: model.sideBText };
    if (model.sideBImageUrl) entity.sideBImageUrl = { S: model.sideBImageUrl };
    return entity;
  }

}

module.exports = new LabelAssembler();
module.exports.LabelAssembler = LabelAssembler;
