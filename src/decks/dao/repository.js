
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

class DecksRepository {

  constructor(options) {
    options = options || {};
    this._dynamodb = options.dynamodb || new AWS.DynamoDB();
    this._tableName = options.tableName || process.env.decksTableName;
  }

  findByUserId(userId) {
    console.info('DecksRepository.findByUserId(userId)', userId);
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        }
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  findByUserIdAndId(userId, id) {
    console.info('DecksRepository.findByUserIdAndId(userId, id)', userId, id);
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        KeyConditionExpression: 'userId = :userId AND id = :id',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
          ':id': { S: id }
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
  save(deck) {
    console.info('DecksRepository.save({ id })', deck.id);
    return new Promise((resolve, reject) => {
      this._dynamodb.putItem({
        TableName: this._tableName,
        Item: deck,
        ReturnConsumedCapacity: 'TOTAL'
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  delete(userId, id) {
    console.info('DecksRepository.delete(userId, id)', userId, id);
    return new Promise((resolve, reject) => {
      this._dynamodb.deleteItem({
        TableName: this._tableName,
        Key: {
          userId: { S: userId },
          id: { S: id }
        }
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

}

module.exports = new DecksRepository();
module.exports.DecksRepository = DecksRepository;
