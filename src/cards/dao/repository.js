
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

class CardsRepository {

  constructor(options) {
    options = options || {};
    this._dynamodb = options.dynamodb || new AWS.DynamoDB();
    this._tableName = options.tableName || process.env.cardsTableName;
  }

  /**
   * @param {string} deck `${userId}|${deckId}`
   */
  find(deck) {
    console.info('CardsRepository.find(deck)', deck);
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
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

  /**
   * @param {string} deck `${userId}|${deckId}`
   */
  findByDeckOrderedByFrequencyAndLastTestTime(userId, deckId) {
    console.info('CardsRepository.findByDeckOrderedByFrequencyAndLastTestTime(userId, deckId)', userId, deckId);
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        IndexName: 'FrequencyIndex',
        KeyConditionExpression: 'deck = :deck',
        ExpressionAttributeValues: {
          ':deck': { S: `${userId}|${deckId}` }
        }
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  /**
   * Create/update the given card.
   */
  save(card) {
    console.info('CardsRepository.save({ deck, id })', card.deck, card.id);
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

  /**
   * @param {string} deck `${userId}|${deckId}`
   * @param {string} id card id
   */
  delete(deck, id) {
    console.info('CardsRepository.delete({ deck, id })', deck, id);
    return new Promise((resolve, reject) => {
      this._dynamodb.deleteItem({
        TableName: this._tableName,
        Key: {
          deck: { S: deck },
          id: { S: id }
        }
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

}

module.exports = new CardsRepository();
module.exports.CardsRepository = CardsRepository;
