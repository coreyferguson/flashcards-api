
const { expect, sinon } = require('../../core/test-utils');
const DecksRepository = require('../../../src/decks/dao/repository').DecksRepository;
const LocalDynamoFacade = require('local-dynamo-facade');
const path = require('path');

describe('DecksRepository', () => {

  const tableName = 'decks-test';
  let repository;
  const facade = new LocalDynamoFacade(
    path.join(__dirname, '../../../serverless.yml')
  );
  const sandbox = sinon.createSandbox();

  before(async function() {
    this.timeout(5000);
    const dynamodb = facade.start();
    repository = new DecksRepository({ dynamodb, tableName });
    await facade.createTable('decksTable', tableName);
    sandbox.stub(console, 'info');
  });

  after(() => {
    facade.stop();
    sandbox.restore();
  });

  it('save/find/delete a deck', async () => {
    const userId = '1111';
    const id = '1112';
    await repository.save({
      userId: { S: userId },
      id: { S: id },
      name: { S: 'Deck 1112' }
    });
    const deck = await repository.findByUserIdAndId(userId, id);
    expect(deck.Items.length).to.equal(1);
    expect(deck.Items[0]).to.eql({
      userId: { S: userId },
      id: { S: id },
      name: { S: 'Deck 1112' }
    });
    await repository.delete(userId, id);
    const noDeck = await repository.findByUserIdAndId(userId, id);
    expect(noDeck.Items.length).to.equal(0);
  });

  it('update a deck', async () => {
    const userId = '1111';
    const id = '1112';
    await repository.save({
      userId: { S: userId },
      id: { S: id },
      name: { S: 'Deck 1112' }
    });
    await repository.findByUserIdAndId(userId, id);
    await repository.save({
      userId: { S: userId },
      id: { S: id },
      name: { S: 'new deck name' }
    });
    const deck = await repository.findByUserIdAndId(userId, id);
    expect(deck.Items[0].name.S).to.equal('new deck name');
  });

  it('find multiple decks for a given user', async () => {
    const userId = 'user-id-1';
    await Promise.all([
      repository.save({
        userId: { S: userId },
        id: { S: 'deck-id-1' },
        name: { S: 'Deck 1' }
      }),
      repository.save({
        userId: { S: userId },
        id: { S: 'deck-id-2' },
        name: { S: 'Deck 2' }
      }),
      repository.save({
        userId: { S: 'user-id-2' },
        id: { S: 'deck-id-1' },
        name: { S: 'Deck 1' }
      })
    ]);
    const decks = await repository.findByUserId(userId);
    expect(decks.Items.length).to.equal(2);
    expect(decks.Items.map(item => item.userId.S)).to.eql(['user-id-1', 'user-id-1']);
    expect(decks.Items.map(item => item.id.S)).to.eql(['deck-id-1', 'deck-id-2']);
  });

});
