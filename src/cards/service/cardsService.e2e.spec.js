
const LocalDynamoFacade = require('local-dynamo-facade');
const { logger } = require('logger-for-kibana');
const path = require('path');
const Repository = require('../dao/cardsRepository').CardsRepository;
const Service = require('./cardsService').CardsService;
const { expect, sinon } = require('../../../test/core/test-utils');

describe('CardsService', () => {

  const tableName = 'cards-test';
  let repository, service;
  const facade = new LocalDynamoFacade( path.join(__dirname, '../../../serverless.yml') );
  const sandbox = sinon.createSandbox();

  before(async function() {
    this.timeout(10000);
    const dynamodb = facade.start();
    repository = new Repository({ dynamodb, tableName });
    await facade.createTable('cardsTable', tableName);
    service = new Service({ repository });
  });

  beforeEach(() => {
    sandbox.stub(logger, 'info');
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(() => {
    facade.stop();
  });

  it('save - new card with all properties', async () => {
    const card = await service.save({
      userId: 'user1',
      sideAText: 'side 1 text',
      sideAImageUrl: 'side 1 image',
      sideBText: 'side 2 text',
      sideBImageUrl: 'side 2 image',
      lastTestTime: '2019-01-01T00:00:00.000Z'
    });
    expect(card.id).to.not.be.undefined;
    expect(card.id).to.match(/\d{14}-.*/, 'id prepended with date');
    expect(card.userId).to.equal('user1');
    expect(card.sideAText).to.equal('side 1 text');
    expect(card.sideAImageUrl).to.equal('side 1 image');
    expect(card.sideBText).to.equal('side 2 text');
    expect(card.sideBImageUrl).to.equal('side 2 image');
    expect(card.lastTestTime).to.equal('2019-01-01T00:00:00.000Z');
    await service.delete('user1', card.id);
  });

  it('save - attach a few labels to a card', async () => {
    const card = await service.save({
      userId: 'userIdValue',
      id: 'cardIdValue',
      sideAText: 'sideATextValue',
      labels: ['labelValue1']
    });
    expect(card.labels).to.eql([ 'labelValue1' ]);
    res = await service.attachLabel('userIdValue', 'cardIdValue', 'labelValue2');
    expect(res.labels).to.eql([ 'labelValue1', 'labelValue2' ]);
    await service.delete('userIdValue', 'cardIdValue');
  });

  it('save - overwrite existing labels', async () => {
    // set up
    await service.save({ userId: 'user1', id: 'card1', labels: ['label1', 'label2'] });
    let card = await service.findOne('user1', 'card1');
    expect(card.labels).to.eql([ 'label1', 'label2' ]);
    // execute function being tested
    card.labels = [ 'label2', 'label3' ];
    await service.save(card);
    // validate
    card = await service.findOne('user1', 'card1');
    expect(card.labels).to.eql([ 'label2', 'label3' ]);
  });

  it('save - ignore labels that are empty string', async () => {
    const card = await service.save({ userId: 'user1', labels: [''] });
    expect(card.labels).to.not.include('');
    await service.delete('user1', card.id);
  });

  it('save - new cards add frequency-often label', async () => {
    const card = await service.save({ userId: 'user1' });
    expect(card.labels).to.contain('frequency-often');
    await service.delete('user1', card.id);
  });

  it('save - new cards with frequency-often included as part of request', async () => {
    const card = await service.save({ userId: 'user1', labels: ['frequency-often'] });
    expect(card.labels).to.eql(['frequency-often']);
    await service.delete('user1', card.id);
  });

  it('delete - deletes vertex and all edges', async () => {
    const card = await service.save({ userId: 'userIdValue', id: 'cardIdValue', labels: ['labelValue1', 'labelValue2'] });
    await service.delete('userIdValue', 'cardIdValue');
    const edge1 = await repository.getEdge('card:userIdValue|cardIdValue', 'label:labelValue1');
    expect(edge1.Item).to.be.undefined;
    const edge2 = await repository.getEdge('card:userIdValue|cardIdValue', 'label:labelValue2');
    expect(edge2.Item).to.be.undefined;
  });

  it('findByLabel - find cards within a given label and user', async () => {
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue1', sideAText: 'side A text value 1' });
    await service.attachLabel('userIdValue1', 'cardIdValue1', 'labelValue1');
    await service.attachLabel('userIdValue1', 'cardIdValue1', 'labelValue2');
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue2', sideAText: 'side A text value 2' });
    await service.attachLabel('userIdValue1', 'cardIdValue2', 'labelValue1');
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue3', sideAText: 'side A text value 3' });
    await service.attachLabel('userIdValue1', 'cardIdValue3', 'labelValue2');
    await service.save({ userId: 'userIdValue2', id: 'cardIdValue4', sideAText: 'side A text value 4' });
    await service.attachLabel('userIdValue2', 'cardIdValue4', 'labelValue1');
    const cards = await service.findByLabel('userIdValue1', 'labelValue1');
    expect(cards).to.eql({
      next: undefined,
      items: [{
        "LabelAndTestTimeIndex_userId_lastTestTime_id": "userIdValue1|1900-01-01T00:00:00.000Z|cardIdValue1",
        userId: 'userIdValue1',
        id: 'cardIdValue1',
        sideAText: 'side A text value 1',
        labels: ['labelValue1', 'labelValue2']
      }, {
        "LabelAndTestTimeIndex_userId_lastTestTime_id": "userIdValue1|1900-01-01T00:00:00.000Z|cardIdValue2",
        userId: 'userIdValue1',
        id: 'cardIdValue2',
        sideAText: 'side A text value 2',
        labels: ['labelValue1']
      }]
    });
    await service.delete('userIdValue1', 'cardIdValue1');
    await service.delete('userIdValue1', 'cardIdValue2');
    await service.delete('userIdValue1', 'cardIdValue3');
    await service.delete('userIdValue2', 'cardIdValue4');
  });

  it('findByLabel - pagination', async () => {
    const create = async id => {
      await service.save({ userId: 'userIdValue1', id: `cardIdValue${id}`, sideAText: `side A text value ${id}` });
      await service.attachLabel('userIdValue1', `cardIdValue${id}`, 'labelValue1');
    };
    const remove = id => service.delete('userIdValue1', `cardIdValue${id}`);
    await Promise.all([ create(1), create(2), create(3), create(4) ]);
    let cards = await service.findByLabel('userIdValue1', 'labelValue1', { pageSize: 2 });
    expect(cards.next).to.not.be.undefined;
    expect(cards.items.length).to.equal(2);
    cards = await service.findByLabel('userIdValue1', 'labelValue1', { pageSize: 2, next: cards.next });
    expect(cards.next).to.not.be.undefined;
    expect(cards.items.length).to.equal(2);
    cards = await service.findByLabel('userIdValue1', 'labelValue1', { pageSize: 2, next: cards.next });
    expect(cards.next).to.be.undefined;
    expect(cards.items.length).to.equal(0);
    await Promise.all([ remove(1), remove(2), remove(3), remove(4) ]);
  });

  it('findByUserId - find collection of cards for given user id', async () => {
    // set up user cards
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue1', sideAText: 'side A text value 1' });
    await Promise.all([
      service.attachLabel('userIdValue1', 'cardIdValue1', 'labelValue1'),
      service.attachLabel('userIdValue1', 'cardIdValue1', 'labelValue2')
    ]);
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue2', sideAText: 'side A text value 2' });
    // set up other user's cards
    await service.save({ userId: 'userIdValueA', id: 'cardIdValueA', sideAText: 'side A text value A' });
    await service.save({ userId: 'userIdValueB', id: 'cardIdValueB', sideAText: 'side A text value B' });
    // fetch cards
    const cards = await service.findByUserId('userIdValue1');
    // validate - order is important
    expect(cards.items.length).to.equal(2);
    expect(cards.items[0].id).to.equal('cardIdValue2');
    expect(cards.items[1].id).to.equal('cardIdValue1');
    expect(cards.items[1].labels).to.eql([ 'labelValue1', 'labelValue2' ]);
    // clean up
    await service.delete('userIdValue1', 'cardIdValue1');
    await service.delete('userIdValue1', 'cardIdValue2');
    await service.delete('userIdValueA', 'cardIdValueA');
    await service.delete('userIdValueB', 'cardIdValueB');
  });

  it('findByUserId - pagination', async () => {
    const create = async id => {
      await service.save({ userId: 'userIdValue1', id: `cardIdValue${id}`, sideAText: `side A text value ${id}` });
      await service.attachLabel('userIdValue1', `cardIdValue${id}`, 'labelValue1');
    };
    const remove = id => service.delete('userIdValue1', `cardIdValue${id}`);
    await Promise.all([ create(1), create(2), create(3), create(4) ]);
    let cards = await service.findByUserId('userIdValue1', { pageSize: 2 });
    expect(cards.next).to.not.be.undefined;
    expect(cards.items.length).to.equal(2);
    cards = await service.findByUserId('userIdValue1', { pageSize: 2, next: cards.next });
    expect(cards.next).to.not.be.undefined;
    expect(cards.items.length).to.equal(2);
    cards = await service.findByUserId('userIdValue1', { pageSize: 2, next: cards.next });
    expect(cards.next).to.be.undefined;
    expect(cards.items.length).to.equal(0);
    await Promise.all([ remove(1), remove(2), remove(3), remove(4) ]);
  });

  it('findOne - find a single card and its labels', async () => {
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue1', labels: ['labelValue1', 'labelValue2'] });
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue2' });
    const card = await service.findOne('userIdValue1', 'cardIdValue1');
    expect(card.userId).to.equal('userIdValue1');
    expect(card.id).to.equal('cardIdValue1');
    expect(card.labels).to.eql([ 'labelValue1', 'labelValue2' ]);
    await Promise.all([
      service.delete('userIdValue1', 'cardIdValue1'),
      service.delete('userIdValue1', 'cardIdValue2')
    ]);
  });

  it('findByLabelOrderByLastTestTime - ordered by last test time', async () => {
    await service.save({
      userId: 'userIdValue1',
      id: 'cardIdValue1',
      lastTestTime: '2019-01-01T00:00:00.001Z',
      labels: ['labelValue1', 'labelValue2']
    });
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue2', labels: ['labelValue1'] });
    await service.save({
      userId: 'userIdValue1',
      id: 'cardIdValue3',
      lastTestTime: '2019-01-01T00:00:00.002Z',
      labels: ['labelValue1']
    });
    await service.save({
      userId: 'userIdValue1',
      id: 'cardIdValue4',
      lastTestTime: '2019-01-01T00:00:00.003Z',
      labels: ['labelValue2']
    });
    const cards = await service.findByLabelOrderByLastTestTime('userIdValue1', 'labelValue1');
    expect(cards).to.eql({
      "items": [{
        "LabelAndTestTimeIndex_userId_lastTestTime_id": "userIdValue1|1900-01-01T00:00:00.000Z|cardIdValue2",
        "id": "cardIdValue2",
        "labels": [ "labelValue1" ],
        "userId": "userIdValue1"
      }, {
        "LabelAndTestTimeIndex_userId_lastTestTime_id": "userIdValue1|2019-01-01T00:00:00.001Z|cardIdValue1",
        "id": "cardIdValue1",
        "labels": [ "labelValue1", "labelValue2" ],
        "lastTestTime": "2019-01-01T00:00:00.001Z",
        "userId": "userIdValue1"
      }, {
        "LabelAndTestTimeIndex_userId_lastTestTime_id": "userIdValue1|2019-01-01T00:00:00.002Z|cardIdValue3",
        "id": "cardIdValue3",
        "labels": [ "labelValue1" ],
        "lastTestTime": "2019-01-01T00:00:00.002Z",
        "userId": "userIdValue1"
      }],
      next: undefined
    });
    await service.delete('userIdValue1', 'cardIdValue1');
    await service.delete('userIdValue1', 'cardIdValue2');
    await service.delete('userIdValue1', 'cardIdValue3');
    await service.delete('userIdValue2', 'cardIdValue4');
  });

  it('newPracticeSession - filled with frequency-often', async () => {
    // set up
    await Promise.all([
      service.save({ userId: 'userIdValue1', id: 'cardIdValue1', labels: ['frequency-often'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue2', labels: ['frequency-often'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue3', labels: ['frequency-sometimes'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue4', labels: ['frequency-sometimes'] })
    ]);
    // execute function being tested
    const cards = await service.newPracticeSession('userIdValue1', { pageSize: 2 });
    // validate
    expect(cards.items.length).to.equal(2);
    expect(cards.items[0].id).to.equal('cardIdValue1');
    expect(cards.items[0].labels).to.eql([ 'frequency-often', 'practice' ]);
    expect(cards.items[1].id).to.equal('cardIdValue2');
    expect(cards.items[1].labels).to.eql([ 'frequency-often', 'practice' ]);
    // clean up
    await Promise.all([
      service.delete('userIdValue1', 'cardIdValue1'),
      service.delete('userIdValue1', 'cardIdValue2'),
      service.delete('userIdValue1', 'cardIdValue3'),
      service.delete('userIdValue1', 'cardIdValue4')
    ]);
  });

  it('newPracticeSession - 1 frequency-often and 1 frequency-sometimes', async () => {
    // set up
    await Promise.all([
      service.save({ userId: 'userIdValue1', id: 'cardIdValue1', labels: ['frequency-often'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue2', labels: ['frequency-sometimes'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue3', labels: ['frequency-sometimes'] }),
    ]);
    // execute function being tested
    const cards = await service.newPracticeSession('userIdValue1', { pageSize: 2 });
    // validate
    expect(cards.items.length).to.equal(2);
    expect(cards.items[0].id).to.equal('cardIdValue1');
    expect(cards.items[0].labels).to.eql([ 'frequency-often', 'practice' ]);
    expect(cards.items[1].id).to.equal('cardIdValue2');
    expect(cards.items[1].labels).to.eql([ 'frequency-sometimes', 'practice' ]);
    // clean up
    await Promise.all([
      service.delete('userIdValue1', 'cardIdValue1'),
      service.delete('userIdValue1', 'cardIdValue2'),
      service.delete('userIdValue1', 'cardIdValue3')
    ]);
  });

  it('newPracticeSession - filled with frequency-sometimes', async () => {
    // set up
    await Promise.all([
      service.save({ userId: 'userIdValue1', id: 'cardIdValue1', labels: ['frequency-sometimes'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue2', labels: ['frequency-sometimes'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue3', labels: ['frequency-sometimes'] }),
    ]);
    // execute function being tested
    const cards = await service.newPracticeSession('userIdValue1', { pageSize: 2 });
    // validate
    expect(cards.items.length).to.equal(2);
    expect(cards.items[0].id).to.equal('cardIdValue1');
    expect(cards.items[0].labels).to.eql([ 'frequency-sometimes', 'practice' ]);
    expect(cards.items[1].id).to.equal('cardIdValue2');
    expect(cards.items[1].labels).to.eql([ 'frequency-sometimes', 'practice' ]);
    // clean up
    await Promise.all([
      service.delete('userIdValue1', 'cardIdValue1'),
      service.delete('userIdValue1', 'cardIdValue2'),
      service.delete('userIdValue1', 'cardIdValue3')
    ]);
  });

  it('detachLabel', async () => {
    // set up
    await Promise.all([
      service.save({ userId: 'userIdValue1', id: 'cardIdValue1', labels: ['labelValue1', 'labelValue2'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue2', labels: ['labelValue1', 'labelValue2'] })
    ]);
    // execute function being tested
    await service.detachLabel('userIdValue1', 'cardIdValue1', 'labelValue1');
    const cards = await service.findByUserId('userIdValue1');
    // validate
    expect(cards.items[0].id).to.equal('cardIdValue2');
    expect(cards.items[0].labels).to.eql([ 'labelValue1', 'labelValue2' ]);
    expect(cards.items[1].id).to.equal('cardIdValue1');
    expect(cards.items[1].labels).to.eql([ 'labelValue2' ]);
    // clean up
    await Promise.all([
      service.delete('userIdValue1', 'cardIdValue1'),
      service.delete('userIdValue1', 'cardIdValue2')
    ]);
  });

  it('deleteLabel', async () => {
    // set up
    await Promise.all([
      service.save({ userId: 'userIdValue1', id: 'cardIdValue1', labels: ['labelValue1', 'labelValue2'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue2', labels: ['labelValue1', 'labelValue2'] }),
      service.save({ userId: 'userIdValue2', id: 'cardIdValue3', labels: ['labelValue1', 'labelValue2'] })
    ]);
    // execute function being tested
    await service.deleteLabel('userIdValue1', 'labelValue1');
    // validate
    let cards = await service.findByUserId('userIdValue1');
    expect(cards.items[0].id).to.equal('cardIdValue2');
    expect(cards.items[0].labels).to.eql([ 'labelValue2' ]);
    expect(cards.items[1].id).to.equal('cardIdValue1');
    expect(cards.items[1].labels).to.eql([ 'labelValue2' ]);
    cards = await service.findByUserId('userIdValue2');
    expect(cards.items[0].id).to.equal('cardIdValue3');
    expect(cards.items[0].labels).to.eql([ 'labelValue1', 'labelValue2' ]);
    // clean up
    await Promise.all([
      service.delete('userIdValue1', 'cardIdValue1'),
      service.delete('userIdValue1', 'cardIdValue2'),
      service.delete('userIdValue1', 'cardIdValue3')
    ]);
  });

  it('deleteLabel - no cards with given label', async () => {
    await service.save({ userId: 'userIdValue1', id: 'cardIdValue1', labels: ['labelValue1', 'labelValue2'] });
    await service.deleteLabel('userIdValue1', 'labelValue3');
    let cards = await service.findByUserId('userIdValue1');
    expect(cards.items[0].id).to.equal('cardIdValue1');
    expect(cards.items[0].labels).to.eql([ 'labelValue1', 'labelValue2' ]);
  });

  it('deleteLabelsOnCard', async () => {
    // set up
    await Promise.all([
      service.save({ userId: 'userIdValue1', id: 'cardIdValue1', labels: ['labelValue1', 'labelValue2'] }),
      service.save({ userId: 'userIdValue1', id: 'cardIdValue2', labels: ['labelValue1'] })
    ]);
    // execute function being tested
    await service.deleteLabelsOnCard('userIdValue1', 'cardIdValue1');
    // verify
    const cards = await service.findByUserId('userIdValue1');
    expect(cards.items[0].id).to.equal('cardIdValue2');
    expect(cards.items[0].labels).to.eql([ 'labelValue1' ]);
    expect(cards.items[1].id).to.equal('cardIdValue1');
    expect(cards.items[1].labels).to.eql([]);
  });

  it('new practice deck contains only user1 cards', async () => {
    await service.save({ userId: 'user1', sideAText: 'card 1 side A text', sideBText: 'card 1 side B text' });
    await service.save({ userId: 'user1', sideAText: 'card 2 side A text', sideBText: 'card 2 side B text' });
    await service.save({ userId: 'user2', sideAText: 'card 1 side A text', sideBText: 'card 1 side B text' });
    await service.save({ userId: 'user2', sideAText: 'card 2 side A text', sideBText: 'card 2 side B text' });
    const practice = await service.newPracticeSession('user1');
    expect(practice.items.length).to.equal(2);
    expect(practice.items[0].userId).to.equal('user1');
    expect(practice.items[1].userId).to.equal('user1');
    expect(practice.items[0].sideAText).to.equal('card 1 side A text');
    expect(practice.items[1].sideAText).to.equal('card 2 side A text');
    // clean up cards
    const deleteCards = async userId => {
      const cards = await service.findByUserId(userId);
      for (let card of cards.items) {
        await service.delete(userId, card.id);
      }
    };
    await deleteCards('user1');
    await deleteCards('user2');
  });

});
