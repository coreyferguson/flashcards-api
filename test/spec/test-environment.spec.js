
const { expect } = require('../core/test-utils.js');

describe('test environment', () => {

  it('`describe` and `it` defined successfully', () => {});

  it('`expect` defined and functions as expected', () => {
    expect(1).to.eql(1);
    expect(true).to.be.true;
    expect(false).to.be.false;
  });

});
