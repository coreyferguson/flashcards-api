
const repository = require('../dao/repository');
const assembler = require('./assembler');

class CardsService {

  constructor(options) {
    this._repository = options.repository || repository;
    this._assembler = options.assembler || assembler;
  }

  async save(model) {
    this._logger.info('CardsService.save', { cardId: model.id });
    const entity = this._assembler.toEntity(model);
    await this._repository.save(entity);
  }

  async findByDeck(deck) {
    this._logger.info('CardsService.findByDeck', { deck });
    const entities = await this._repository.findByDeck(deck);
    const models = this._assembler.toModels(entities);
    return models;
  }

  async findByUserId(userId, options) {
    this._logger.info('CardsService.findByUserId', { deck });
    const entities = await this._repository.findByUserId(userId, options);
    const models = this._assembler.toModels(entities);
    return models;
  }

}

module.exports = new CardsService();
module.exports.CardsService = CardsService;
