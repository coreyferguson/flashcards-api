
const { expect } = require('../../../core/test-utils');
const { toCursor, fromCursor } = require('../../../../src/cards/service/defaultIndexCursorAssembler');

describe('defaultIndexCursorAssembler', () => {

  it('test toCursor and back with fromCursor', () => {
    const cursor = toCursor({
      userId: { S: 'userIdValue' },
      id: { S: 'idValue' }
    });
    const obj = fromCursor('userIdValue', cursor);
    expect(obj).to.eql({
      userId: { S: 'userIdValue' },
      id: { S: 'idValue' }
    });
  });

});
