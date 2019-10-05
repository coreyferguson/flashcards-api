
const findByCardIdModelAssembler = require('./findByCardIdModelAssembler');
const findByLabelCursorAssembler = require('./findByLabelCursorAssembler');
const findByUserIdCursorAssembler = require('./findByUserIdCursorAssembler');
const labelAssembler = require('./labelAssembler');
const repository = require('../dao/cardsRepository');
const uuid = require('uuid/v4');
const { logger } = require('logger-for-kibana');
const moment = require('moment');

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

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

  async attachLabel(userId, id, label) {
    this._logger.info('CardsService.attachLabel', { userId, id, label });
    const card = await this.findOne(userId, id);
    const model = {
      userId,
      id,
      label,
      lastTestTime: card.lastTestTime ? card.lastTestTime : undefined,
      LabelAndTestTimeIndex_userId_lastTestTime_id: card.LabelAndTestTimeIndex_userId_lastTestTime_id
    };
    const entity = this._labelAssembler.toEntity(model, label);
    await this._repository.saveEdge(entity);
    const updatedEntity = await this._repository.findByCardId(model.userId, model.id);
    const updatedModel = this._findByCardIdModelAssembler.toModel(updatedEntity);
    return updatedModel;
  }

  async delete(userId, id) {
    this._logger.info('CardsService.delete', { userId, id });
    const existing = await this._repository.findByCardId(userId, id);
    const promises = existing.Items.map(item => this._repository.deleteEdge(item.vertex.S, item.edge.S));
    await Promise.all(promises);
  }

  async deleteLabel(userId, label) {
    const cards = await this.findByLabel(userId, label);
    const keys = cards.items.map(card => ({ userId, id: card.id, label }));
    if (keys.length === 0) return;
    await this._repository.deleteLabelBatch(keys);
  }

  async deleteLabelsOnCard(userId, id) {
    const card = await this.findOne(userId, id);
    const keys = card.labels.map(label => ({ userId, id, label }));
    if (keys.length === 0) return;
    await this._repository.deleteLabelBatch(keys);
  }

  async detachLabel(userId, id, label) {
    this._logger.info('CardsService.detachLabel', { userId, id, label });
    await this._repository.deleteEdgeByLabel(userId, id, label);
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

  async findByLabelOrderByLastTestTime(userId, label, options) {
    this._logger.info('CardsService.findByLabelOrderByLastTestTime', { userId, label });
    options = options || {};
    options.next = this._findByLabelCursorAssembler.fromCursor(options.next, userId, label);
    const cards = await this._repository.findByLabelOrderByLastTestTime(userId, label, options);
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

  async findOne(userId, id) {
    this._logger.info('CardsService.findOne', { userId, id });
    const entity = await this._repository.findByCardId(userId, id);
    const model = this._findByCardIdModelAssembler.toModel(entity);
    return model;
  }

  async newPracticeSession(userId, options) {
    this._logger.info('CardsService.newPracticeSession', { userId });
    options = options || {};
    const pageSize = options.pageSize || 20;
    await this.deleteLabel(userId, 'practice');
    const often = await this._repository.findByLabelOrderByLastTestTime(userId, 'frequency-often', { pageSize });
    const sometimes = await this._repository.findByLabelOrderByLastTestTime(userId, 'frequency-sometimes', { pageSize });
    const practiceSession = [ ...often.Items, ...sometimes.Items ].slice(0, pageSize);
    const keys = practiceSession.map(card =>  ({
      vertex: card.vertex,
      edge: { S: 'label:practice' },
      LabelAndTestTimeIndex_userId_lastTestTime_id: card.LabelAndTestTimeIndex_userId_lastTestTime_id
    }));
    await this._repository.saveEdgeBatch(keys);
    await timeout(50); // give a little buffer for secondary indexes to be updated
    return this.findByLabelOrderByLastTestTime(userId, 'practice');
  }

  async save(model) {
    if (model.id) {
      this._logger.info('CardsService.save:update', { cardId: model.id });
    } else {
      const cardId = this.createId();
      this._logger.info('CardsService.save:create', { cardId });
      model.id = cardId;
      model.labels = model.labels || [];
      model.labels.push('frequency-often');
      model.lastTestTime =  model.lastTestTime || new Date().toISOString();
    }
    let entity = this._findByCardIdModelAssembler.toEntity(model);
    await this._repository.saveEdge(entity);
    let card = await this.findOne(model.userId, model.id);
    if (!this._arraysAreEqual(card.labels, model.labels)) {
      model.labels = model.labels || [];
      await this.deleteLabelsOnCard(model.userId, model.id);
      const keys = model.labels.map(label => ({
        vertex: { S: `card:${model.userId}|${model.id}` },
        edge: { S: `label:${label}` },
        LabelAndTestTimeIndex_userId_lastTestTime_id: entity.LabelAndTestTimeIndex_userId_lastTestTime_id
      }));
      await this._repository.saveEdgeBatch(keys);
      card = this.findOne(model.userId, model.id);
    }
    return card;
  }

  createId() {
    const now = moment().format('YYYYMMDDHHmmss');
    const id = now + '-' + uuid();
    return id;
  }

  _arraysAreEqual(arr1, arr2) {
    if (!arr1 && !arr2) return true;
    if (!arr1 || !arr2) return false;
    let s1 = new Set();
    for (let item of arr1) s1.add(item);
    for (let item of arr2) {
      if (!s1.has(item)) return false;
      s1.delete(item);
    }
    return arr2.size === 0;
  }

}

module.exports = new CardsService();
module.exports.CardsService = CardsService;
