
const { logger } = require('logger-for-kibana');

class FindByCardIdModelAssembler {

  constructor(options) {
    options = options || {};
    this._logger = options.logger || logger;
  }

  toEntity(model) {
    this._logger.info('FindByCardIdModelAssembler.toEntity', { modelId: model.id });
    const entity = {};
    entity.vertex = { S: `card:${model.userId}|${model.id}` };
    entity.edge = { S: `card:${model.userId}|${model.id}` };
    entity.UserIdIndex_userId = { S: model.userId };
    entity.UserIdIndex_id = { S: model.id };
    if (model.sideAText) entity.sideAText = { S: model.sideAText };
    if (model.sideAImageUrl) entity.sideAImageUrl = { S: model.sideAImageUrl };
    if (model.sideBText) entity.sideBText = { S: model.sideBText };
    if (model.sideBImageUrl) entity.sideBImageUrl = { S: model.sideBImageUrl };
    return entity;
  }

  toModel(entity) {
    if (entity.Items.length === 0) {
      this._logger.info('FindByCardIdModelAssembler.toModel; null entity');
      return undefined;
    }
    this._logger.info('FindByCardIdModelAssembler.toModel', { vertex: entity.Items[0].vertex.S });
    const model = { labels: [] };
    for (let item of entity.Items) {
      const [ userId, id ] = item.vertex.S.replace('card:', '').split('|');
      model.userId = userId;
      model.id = id;
      if (item.edge.S === item.vertex.S) {
        if (item.sideAText) model.sideAText = item.sideAText.S;
        if (item.sideAImageUrl) model.sideAImageUrl = item.sideAImageUrl.S;
        if (item.sideBText) model.sideBText = item.sideBText.S;
        if (item.sideBImageUrl) model.sideBImageUrl = item.sideBImageUrl.S;
      } else {
        model.labels.push(item.edge.S.replace('label:', ''));
      }
    }
    return model;
  }

}

module.exports = new FindByCardIdModelAssembler();
module.exports.FindByCardIdModelAssembler = FindByCardIdModelAssembler;
