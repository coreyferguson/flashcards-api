
const { expect } = require('../../core/test-utils');
const CardsRepository = require('../../../src/cards/dao/repository').CardsRepository;
const LocalDynamoFacade = require('local-dynamo-facade');
const path = require('path');

describe('CardsRepository', () => {

  const tableName = 'cards-test';
  let repository;
  const facade = new LocalDynamoFacade(
    path.join(__dirname, '../../../serverless.yml')
  );

  before(function() {
    this.timeout(5000);
    const dynamodb = facade.start();
    repository = new CardsRepository({ dynamodb, tableName });
    return facade.createTable('cardsTable', tableName);
  });

  after(() => {
    facade.stop();
  });

  it('save/find within a deck', async () => {
    const deck = 'userId|deckId';
    await repository.save({
      deck: { S: deck }
    });
    const card = await repository.find(deck);
    console.log('card:', card);
    return card;
  });

});
