
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });
const { logger } = require('logger-for-kibana');

class CardsRepository {

  constructor(options) {
    options = options || {};
    this._dynamodb = options.dynamodb || new AWS.DynamoDB();
    this._tableName = options.tableName || process.env.cardsTableName;
    this._logger = options.logger || logger;
  }

  async findByUserId(userId, options) {
    this._logger.info('CardsRepository.findOne', { userId });
    let { pageSize, after } = options || {};
    pageSize = pageSize || 100;
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        },
        Limit: pageSize,
        ExclusiveStartKey: after
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async findByDeck(deck) {
    this._logger.info('CardsRepository.findByDeck', { deck });
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        IndexName: 'DeckIndex',
        KeyConditionExpression: 'deck = :deck',
        ExpressionAttributeValues: {
          ':deck': { S: deck }
        }
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async save(card) {
    this._logger.info('CardsRepository.save', { cardId: card.id });
    return new Promise((resolve, reject) => {
      this._dynamodb.putItem({
        TableName: this._tableName,
        Item: card,
        ReturnConsumedCapacity: 'TOTAL'
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

}

module.exports = new CardsRepository();
module.exports.CardsRepository = CardsRepository;
