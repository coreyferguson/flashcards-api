
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
    console.log('CardsRepository.find(deck)', deck);
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
   * Create/update the given card.
   */
  save(card) {
    console.log('CardsRepository.save({ deck })', card.deck);
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
