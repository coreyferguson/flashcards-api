
const repository = require('../dao/repository');
const assembler = require('./assembler');
const { logger } = require('logger-for-kibana');
const uuid = require('uuid/v4');
const { toCursor, fromCursor } = require('./defaultIndexCursorAssembler');

class CardsService {

  constructor(options) {
    options = options || {};
    this._repository = options.repository || repository;
    this._assembler = options.assembler || assembler;
    this._logger = options.logger || logger;
  }

  async save(model) {
    if (model.id) {
      this._logger.info('CardsService.save:update', { cardId: model.id });
    } else {
      const cardId = uuid();
      this._logger.info('CardsService.save:create', { cardId });
      model.id = cardId;
    }
    const entity = this._assembler.toEntity(model);
    await this._repository.save(entity);
    const updatedEntity = await this._repository.findOne(model.userId, model.id);
    this._logger.info('CardsService.save', { updatedEntity });
    return this._assembler.toModel(updatedEntity);
  }

  async findByDeck(deck, options) {
    this._logger.info('CardsService.findByDeck', { deck });
    const entities = await this._repository.findByDeck(deck, options);
    const models = this._assembler.toModels(entities);
    return models;
  }

  async findOne(userId, id) {
    this._logger.info('CardsService.findOne', { userId, id });
    const entity = await this._repository.findOne(userId, id);
    const model = this._assembler.toModel(entity);
    return model;
  }

  async findByUserId(userId, options) {
    this._logger.info('CardsService.findByUserId', { userId });
    if (options.next) options.next = fromCursor(userId, options.next);
    const entities = await this._repository.findByUserId(userId, options);
    const models = this._assembler.toModels(entities, toCursor);
    return models;
  }

}

module.exports = new CardsService();
module.exports.CardsService = CardsService;
