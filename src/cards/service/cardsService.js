
const findByCardIdModelAssembler = require('./findByCardIdModelAssembler');
const findByLabelCursorAssembler = require('./findByLabelCursorAssembler');
const findByUserIdCursorAssembler = require('./findByUserIdCursorAssembler');
const labelAssembler = require('./labelAssembler');
const repository = require('../dao/cardsRepository');
const uuid = require('uuid/v4');
const { logger } = require('logger-for-kibana');

class CardsService {

  constructor(options) {
    options = options || {};
    this._findByUserIdCursorAssembler = options.findByUserIdCursorAssembler || findByUserIdCursorAssembler;
    this._findByCardIdModelAssembler = options.findByCardIdModelAssembler || findByCardIdModelAssembler;
    this._findByLabelCursorAssembler = options.findByLabelCursorAssembler || findByLabelCursorAssembler;
    this._labelAssembler = options.labelAssembler || labelAssembler;
    this._logger = options.logger || logger;
    this._repository = options.repository || repository;
  }

  async save(model) {
    if (model.id) {
      this._logger.info('CardsService.save:update', { cardId: model.id });
    } else {
      const cardId = uuid();
      this._logger.info('CardsService.save:create', { cardId });
      model.id = cardId;
    }
    const entity = this._findByCardIdModelAssembler.toEntity(model);
    await this._repository.saveEdge(entity);
    const updatedEntity = await this._repository.findByCardId(model.userId, model.id);
    return this._findByCardIdModelAssembler.toModel(updatedEntity);
  }

  async findOne(userId, id) {
    this._logger.info('CardsService.findOne', { userId, id });
    const entity = await this._repository.findByCardId(userId, id);
    const model = this._findByCardIdModelAssembler.toModel(entity);
    return model;
  }

  async delete(userId, id) {
    this._logger.info('CardsService.delete', { userId, id });
    const existing = await this._repository.findByCardId(userId, id);
    const promises = existing.Items.map(item => this._repository.deleteEdge(item.vertex.S, item.edge.S));
    await Promise.all(promises);
  }

  async attachLabel(userId, id, label) {
    this._logger.info('CardsService.attachLabel', { userId, id, label });
    const model = { userId, id, label };
    const entity = this._labelAssembler.toEntity(model, label);
    await this._repository.saveEdge(entity);
    const updatedEntity = await this._repository.findByCardId(model.userId, model.id);
    const updatedModel = this._findByCardIdModelAssembler.toModel(updatedEntity);
    return updatedModel;
  }

  async findByLabel(userId, label, options) {
    this._logger.info('CardsService.findByLabel', { userId, label });
    options = options || {};
    options.next = this._findByLabelCursorAssembler.fromCursor(options.next, userId, label);
    const cards = await this._repository.findByLabel(userId, label, options);
    const promises = cards.Items.map(async item => {
      const id = item.vertex.S.replace('card:', '').split('|')[1];
      const entity = await this._repository.findByCardId(userId, id);
      const model = await this._findByCardIdModelAssembler.toModel(entity);
      return model;
    });
    const collection = {};
    collection.items = await Promise.all(promises);
    collection.next = this._findByLabelCursorAssembler.toCursor(cards);
    return collection;
  }

  async findByUserId(userId, options) {
    this._logger.info('CardsService.findByUserId', { userId });
    options = options || {};
    options.next = this._findByUserIdCursorAssembler.fromCursor(options.next, userId);
    const cards = await this._repository.findByUserId(userId, options);
    const promises = cards.Items.map(async item => {
      const id = item.vertex.S.replace('card:', '').split('|')[1];
      const entity = await this._repository.findByCardId(userId, id);
      const model = await this._findByCardIdModelAssembler.toModel(entity);
      return model;
    });
    const collection = {};
    collection.items = await Promise.all(promises);
    collection.next = this._findByUserIdCursorAssembler.toCursor(cards);
    return collection;
  }

}

module.exports = new CardsService();
module.exports.CardsService = CardsService;
