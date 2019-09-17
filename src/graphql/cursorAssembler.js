
const toCursor = object => {
  const string = JSON.stringify(object);
  return Buffer.from(string).toString('base64');
};

const fromCursor = cursor => {
  const string = Buffer.from(cursor, 'base64').toString('ascii');
  const object = JSON.parse(string);
  return object;
}

module.exports = { toCursor, fromCursor };
