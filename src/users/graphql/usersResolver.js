
module.exports = (parent, args, context, info) => {
  if (context && context.user && context.user.sub)
    return { sub: context.user.sub }
  return undefined;
};
