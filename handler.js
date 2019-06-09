'use strict';

module.exports.unauthenticated = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:8080',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your unauthenticated function executed successfully!',
      event
    }, null, 2),
  };
};

module.exports.authenticated = async event => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:8080',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your authenticated function executed successfully!',
      event
    }, null, 2),
  };
};
