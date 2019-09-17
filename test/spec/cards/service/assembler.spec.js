
const { expect, sinon } = require('../../../core/test-utils');
const CardsServiceAssembler = require('../../../../src/cards/service/assembler').CardsServiceAssembler;
const logger = require('logger-for-kibana').stub;

describe('CardsServiceAssembler', () => {

  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('expect toEntity to be logged', () => {
    sandbox.stub(logger, 'info');
    const assembler = new CardsServiceAssembler({ logger });
    assembler.toEntity({ userId: 'userIdValue', id: 'cardIdValue' });
    expect(logger.info).to.be.calledOnce;
  });

  it('expect toEntity to translate all properties', () => {
    const assembler = new CardsServiceAssembler({ logger });
    const entity = assembler.toEntity({
      userId: 'userIdValue',
      id: 'cardIdValue',
      deck: 'deckValue',
      sideAText: 'sideATextValue',
      sideAImageUrl: 'sideAImageUrlValue',
      sideBText: 'sideBTextValue',
      sideBImageUrl: 'sideBImageUrlValue'
    });
    expect(entity.id).to.eql({ S: 'cardIdValue' });
    expect(entity.userId).to.eql({ S: 'userIdValue' });
    expect(entity.deck).to.eql({ S: 'deckValue' });
    expect(entity.sideAText).to.eql({ S: 'sideATextValue' });
    expect(entity.sideAImageUrl).to.eql({ S: 'sideAImageUrlValue' });
    expect(entity.sideBText).to.eql({ S: 'sideBTextValue' });
    expect(entity.sideBImageUrl).to.eql({ S: 'sideBImageUrlValue' });
  });

  it('expect toModel to be logged', () => {
    sandbox.stub(logger, 'info');
    const assembler = new CardsServiceAssembler({ logger });
    assembler.toModel({
      userId: { S: 'idValue' },
      id: { S: 'idValue' }
    });
    expect(logger.info).to.be.calledOnce;
  });

  it('expect toModel to translate all properties', () => {
    sandbox.stub(logger, 'info');
    const assembler = new CardsServiceAssembler({ logger });
    const model = assembler.toModel({
      userId: { S: 'userIdValue' },
      id: { S: 'idValue' },
      deck: { S: 'deckValue' },
      sideAText: { S: 'sideATextValue' },
      sideAImageUrl: { S: 'sideAImageUrlValue' },
      sideBText: { S: 'sideBTextValue' },
      sideBImageUrl: { S: 'sideBImageUrlValue' }
    });
    expect(model.userId).to.equal('userIdValue');
    expect(model.id).to.equal('idValue');
    expect(model.deck).to.equal('deckValue');
    expect(model.sideAText).to.equal('sideATextValue');
    expect(model.sideAImageUrl).to.equal('sideAImageUrlValue');
    expect(model.sideBText).to.equal('sideBTextValue');
    expect(model.sideBImageUrl).to.equal('sideBImageUrlValue');
  });

  it('toModels translated all properties with next cursor', () => {
    const assembler = new CardsServiceAssembler({ logger });
    const entities = {
      "Items":[
        {
          "userId":{"S":"user_id_1"},
          "id":{"S":"card_id_1"},
          "deck":{"S":"deck_1"},
          "sideAText":{"S":"sideAText_value_1"}
        },
        {
          "userId":{"S":"user_id_1"},
          "id":{"S":"card_id_2"},
          "deck":{"S":"deck_1"},
          "sideAText":{"S":"sideAText_value_2"}
        }
      ],
      "Count":1,
      "ScannedCount":1,
      "LastEvaluatedKey":{
        "userId":{"S":"user_id_1"},
        "id":{"S":"card_id_2"}
      }
    };
    const models = assembler.toModels(entities, toCursor => toCursor);
    expect(models.items.length).to.equal(2);
    expect(models.items[0].sideAText).to.equal('sideAText_value_1');
    expect(models.items[1].sideAText).to.equal('sideAText_value_2');
    expect(models.next).to.not.be.undefined;
  });

  it('toModels translated all properties without next cursor', () => {
    const assembler = new CardsServiceAssembler({ logger });
    const entities = {
      "Items":[
        {
          "userId":{"S":"user_id_1"},
          "id":{"S":"card_id_1"},
          "deck":{"S":"deck_1"},
          "sideAText":{"S":"sideAText_value_1"}
        },
        {
          "userId":{"S":"user_id_1"},
          "id":{"S":"card_id_2"},
          "deck":{"S":"deck_1"},
          "sideAText":{"S":"sideAText_value_2"}
        }
      ],
      "Count":1,
      "ScannedCount":1
    };
    const models = assembler.toModels(entities);
    expect(models.items.length).to.equal(2);
    expect(models.items[0].sideAText).to.equal('sideAText_value_1');
    expect(models.items[1].sideAText).to.equal('sideAText_value_2');
  });

});
