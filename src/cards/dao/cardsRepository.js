
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

  async deleteEdge(vertex, edge) {
    return new Promise((resolve, reject) => {
      this._dynamodb.deleteItem({
        TableName: this._tableName,
        Key: {
          vertex: { S: vertex },
          edge: { S: edge }
        }
      }, (err, data) => {
        if (err) reject (err);
        else resolve(data);
      });
    });
  }

  async deleteEdgeByLabel(userId, id, label) {
    const vertex = `card:${userId}|${id}`
    const edge =`label:${label}`;
    return this.deleteEdge(vertex, edge);
  }

  async deleteLabelBatch(keys) {
    this._logger.info('CardsRepository.deleteLabelBatch');
    return new Promise((resolve, reject) => {
      this._dynamodb.batchWriteItem({
        RequestItems: {
          [this._tableName]: keys.map(key => ({
            DeleteRequest: {
              Key: {
                vertex: { S: `card:${key.userId}|${key.id}` },
                edge: { S: `label:${key.label}` }
              }
            }
          }))
        }
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async findByCardId(userId, id) {
    this._logger.info('CardsRepository.findOne', { userId, id });
    const vertex = `card:${userId}|${id}`;
    const pageSize = 20;
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        KeyConditionExpression: 'vertex = :vertex',
        ExpressionAttributeValues: {
          ':vertex': { S: vertex }
        },
        Limit: pageSize
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async findByLabel(userId, label, options) {
    this._logger.info('CardsRepository.findByLabel', { userId, label });
    const edge = `label:${label}`;
    let { pageSize, next } = options || {};
    pageSize = pageSize || 100;
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        IndexName: 'LabelIndex',
        KeyConditionExpression: 'edge = :edge and begins_with(vertex, :userId)',
        ExpressionAttributeValues: {
          ':edge': { S: edge },
          ':userId': { S: `card:${userId}` }
        },
        Limit: pageSize,
        ExclusiveStartKey: next
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async findByLabelOrderByLastTestTime(userId, label, options) {
    this._logger.info('CardsRepository.findByLabelOrderByLastTestTime', { userId, label });
    const edge = `label:${label}`;
    let { pageSize, next } = options || {};
    pageSize = pageSize || 100;
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        IndexName: 'LabelAndLastTestTimeIndex',
        KeyConditionExpression: 'edge = :edge',
        ExpressionAttributeValues: {
          ':edge': { S: edge }
        },
        Limit: pageSize,
        ExclusiveStartKey: next,
        ScanIndexForward: true
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async findByUserId(userId, options) {
    this._logger.info('CardsRepository.findByUserId', { userId });
    let { pageSize, next } = options || {};
    pageSize = pageSize || 100;
    return new Promise((resolve, reject) => {
      this._dynamodb.query({
        TableName: this._tableName,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'UserIdIndex_userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        },
        Limit: pageSize,
        ExclusiveStartKey: next,
        ScanIndexForward: false
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async getEdge(vertex, edge) {
    this._logger.info('CardsRepository.findEdge', { vertex, edge });
    return new Promise((resolve, reject) => {
      this._dynamodb.getItem({
        TableName: this._tableName,
        Key: {
          vertex: { S: vertex },
          edge: { S: edge }
        }
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async saveEdge(card) {
    this._logger.info('CardsRepository.save', { vertex: card.vertex.S });
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

  async saveEdgeBatch(keys) {
    this._logger.info('CardsRepository.saveEdgeBatch');
    return new Promise((resolve, reject) => {
      this._dynamodb.batchWriteItem({
        RequestItems: {
          [this._tableName]: keys.map(key => ({
            PutRequest: {
              Item: {
                vertex: key.vertex,
                edge: key.edge,
                LabelAndTestTimeIndex_userId_lastTestTime_id: key.LabelAndTestTimeIndex_userId_lastTestTime_id
              }
            }
          }))
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
