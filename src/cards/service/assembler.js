
const { logger } = require('logger-for-kibana');

class CardsServiceAssembler {

  constructor(options) {
    options = options || {};
    this._logger = options.logger || logger;
  }

  toEntity(model) {
    this._logger.info('CardsServiceAssembler.toEntity', { modelId: model.id });
    const entity = {};
    entity.userId = { S: model.userId };
    entity.id = { S: model.id };
    if (model.deck) entity.deck = { S: model.deck };
    if (model.sideAText) entity.sideAText = { S: model.sideAText };
    if (model.sideAImageUrl) entity.sideAImageUrl = { S: model.sideAImageUrl };
    if (model.sideBText) entity.sideBText = { S: model.sideBText };
    if (model.sideBImageUrl) entity.sideBImageUrl = { S: model.sideBImageUrl };
    return entity;
  }

  toModel(entity) {
    this._logger.info('CardsServiceAssembler.toModel', { entityId: entity.id.S });
    const model = {};
    model.userId = entity.userId.S;
    model.id = entity.id.S;
    if (entity.deck) model.deck = entity.deck.S;
    if (entity.sideAText) model.sideAText = entity.sideAText.S;
    if (entity.sideAImageUrl) model.sideAImageUrl = entity.sideAImageUrl.S;
    if (entity.sideBText) model.sideBText = entity.sideBText.S;
    if (entity.sideBImageUrl) model.sideBImageUrl = entity.sideBImageUrl.S;
    return model;
  }

  toModels(entities, toCursor) {
    this._logger.info('CardsServiceAssembler.toModels');
    const models = {};
    models.items = entities.Items.map(this.toModel.bind(this));
    if (entities.LastEvaluatedKey) models.next = toCursor(entities.LastEvaluatedKey);
    return models;
  }

}

module.exports = new CardsServiceAssembler();
module.exports.CardsServiceAssembler = CardsServiceAssembler;
