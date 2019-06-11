
const { expect, sinon } = require('../../core/test-utils');
const CardsRepository = require('../../../src/cards/dao/repository').CardsRepository;
const Frequencies = require('../../../src/cards/dao/Frequencies');
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

  it('findByDeckOrderedByFrequencyAndLastTestTime', async () => {
    const find = repository
      .findByDeckOrderedByFrequencyAndLastTestTime
      .bind(repository);
    const deck = 'userId|deckId';
    const save = async (deck, id, frequency, lastTestTime) => {
      lastTestTime = lastTestTime || new Date().toISOString();
      const frequencyIndex = Frequencies[frequency];
      await repository.save({
        deck: { S: deck },
        id: { S: id },
        frequencyAndLastTestTime: { S: `${frequencyIndex}|${lastTestTime}` },
        frequency: { S: frequency },
        frequencyIndex: { N: `${frequencyIndex}` },
        lastTestTime: { S: lastTestTime }
      });
    };
    await Promise.all([
      save(deck, '1111', 'rarely'),
      save(deck, '1112', 'sometimes'),
      save(deck, '1113', 'often'),
      save(deck, '1114', 'always', '2019-01-01T00:00:00.000Z'),
      save(deck, '1115', 'always', '2019-01-02T00:00:00.000Z')
    ]);
    const cards = await find('userId', 'deckId');
    expect(cards.Items.length).to.equal(5);
    expect(cards.Items.map(item => item.id.S))
      .to.eql([ '1114', '1115', '1113', '1112', '1111'])
    await Promise.all([
      repository.delete(deck, '1111'),
      repository.delete(deck, '1112'),
      repository.delete(deck, '1113'),
      repository.delete(deck, '1114'),
      repository.delete(deck, '1115')
    ]);
  });

});
