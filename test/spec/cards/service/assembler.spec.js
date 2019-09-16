
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
      text: 'textValue'
    });
    expect(entity.id).to.eql({ S: 'cardIdValue' });
    expect(entity.userId).to.eql({ S: 'userIdValue' });
    expect(entity.deck).to.eql({ S: 'deckValue' });
    expect(entity.text).to.eql({ S: 'textValue' });
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
      text: { S: 'textValue' }
    });
    expect(model.userId).to.equal('userIdValue');
    expect(model.id).to.equal('idValue');
    expect(model.deck).to.equal('deckValue');
    expect(model.text).to.equal('textValue');
  });

  it('toModels translated all properties with next cursor', () => {
    const assembler = new CardsServiceAssembler({ logger });
    const entities = {
      "Items":[
        {
          "userId":{"S":"user_id_1"},
          "id":{"S":"card_id_1"},
          "deck":{"S":"deck_1"},
          "text":{"S":"text_value_1"}
        },
        {
          "userId":{"S":"user_id_1"},
          "id":{"S":"card_id_2"},
          "deck":{"S":"deck_1"},
          "text":{"S":"text_value_2"}
        }
      ],
      "Count":1,
      "ScannedCount":1,
      "LastEvaluatedKey":{
        "userId":{"S":"user_id_1"},
        "id":{"S":"card_id_2"}
      }
    };
    const models = assembler.toModels(entities);
    expect(models.items.length).to.equal(2);
    expect(models.items[0].text).to.equal('text_value_1');
    expect(models.items[1].text).to.equal('text_value_2');
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
          "text":{"S":"text_value_1"}
        },
        {
          "userId":{"S":"user_id_1"},
          "id":{"S":"card_id_2"},
          "deck":{"S":"deck_1"},
          "text":{"S":"text_value_2"}
        }
      ],
      "Count":1,
      "ScannedCount":1
    };
    const models = assembler.toModels(entities);
    expect(models.items.length).to.equal(2);
    expect(models.items[0].text).to.equal('text_value_1');
    expect(models.items[1].text).to.equal('text_value_2');
  });

});
