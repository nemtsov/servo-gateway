var logger = require('../logger')('permission'),
  DEBUG = process.env.DEBUG,
  contextOrder = ['org', 'type', 'distribution', 'origin', 'region', 'app', 'stack'];

module.exports = {
  buildContext: function (params) {
    var contextKeys = Object.keys(params);
    // Sort contextKeys using order
    contextKeys.sort(function(a, b) {
      return contextOrder.indexOf(a) - contextOrder.indexOf(b);
    });
    // Get array of context values using ordered keys
    var context = contextKeys.map(function(key) {
      return params[key];
    }).join(':');

    if (DEBUG) logger.debug('buildContext', params, context);
    return context;
  },

  parseContext: function (context) {
    var delimiter = ':',
      index = 0,
      contexts = [];
    while (index !== -1) {
      index = context.indexOf(delimiter, index + 1);
      contexts.push(context.substring(0, index !==-1 ? index: context.length));
    }
    contexts = contexts.filter(function (context, index) {
      return index !==1;
    });
    if (DEBUG) logger.debug('parseContext', context, contexts);
    return contexts;
  }
};
