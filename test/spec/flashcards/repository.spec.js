
const { expect, sinon } = require('../../core/test-utils');
const CardsRepository = require('../../../src/cards/dao/repository').CardsRepository;
const LocalDynamoFacade = require('local-dynamo-facade');
const path = require('path');

describe('CardsRepository', () => {

  const tableName = 'cards-test';
  let repository;
  const facade = new LocalDynamoFacade(
    path.join(__dirname, '../../../serverless.yml')
  );
  const sandbox = sinon.createSandbox();

  before(async function() {
    this.timeout(5000);
    const dynamodb = facade.start();
    repository = new CardsRepository({ dynamodb, tableName });
    await facade.createTable('cardsTable', tableName);
    sandbox.stub(console, 'info');
  });

  after(() => {
    facade.stop();
    sandbox.restore();
  });

  it('save/find/delete a card within a deck', async () => {
    const deck = 'userId|deckId';
    const cardId = 'cardId';
    await repository.save({
      deck: { S: deck },
      id: { S: cardId }
    });
    const cards = await repository.find(deck);
    await repository.delete(deck, cardId);
    const noCards = await repository.find(deck);
    expect(cards.Items.length).to.equal(1);
    expect(cards.Items[0].deck.S).to.equal(deck);
    expect(cards.Items[0].id.S).to.equal(cardId);
    expect(noCards.Items.length).to.equal(0);
  });

  it('update a card', async () => {
    const deck = 'userId|deckId';
    const cardId = 'cardId';
    await repository.save({
      deck: { S: deck },
      id: { S: cardId },
      property: { S: 'value1' }
    });
    const cardsBefore = await repository.find(deck);
    await repository.save({
      deck: { S: deck },
      id: { S: cardId },
      property: { S: 'value2' }
    });
    const cardsAfter = await repository.find(deck);
    expect(cardsBefore.Items.length).to.equal(1);
    expect(cardsBefore.Items[0].property.S).to.equal('value1');
    expect(cardsAfter.Items.length).to.equal(1);
    expect(cardsAfter.Items[0].property.S).to.equal('value2');
    repository.delete(deck, cardId);
  });

  it('find multiple cards in a deck', async () => {
    const deck = 'userId|deckId';
    await repository.save({
      deck: { S: deck },
      id: { S: 'id1' }
    });
    await repository.save({
      deck: { S: deck },
      id: { S: 'id2' }
    });
    await repository.save({
      deck: { S: `${deck}2` },
      id: { S: 'id1' }
    });
    const cards = await repository.find(deck);
    const otherCards = await repository.find(`${deck}2`);
    expect(cards.Items.length).to.equal(2);
    expect(otherCards.Items.length).to.equal(1);
    await Promise.all([
      repository.delete(deck, 'id1'),
      repository.delete(deck, 'id2'),
      repository.delete(`${deck}2`, 'id1')
    ]);
  });

});
