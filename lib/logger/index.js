var bunyan = require('bunyan'),
  PrettyStream = require('bunyan-prettystream'),
  stream = process.stdout,
  logger, prettyStdOut;

if (!process.env.PRODUCTION) {
  prettyStdOut = new PrettyStream();
  prettyStdOut.pipe(process.stdout);
  stream = prettyStdOut;
}

logger = bunyan.createLogger({
  name: 'servo-gateway',
  stream: stream,
  level: 'debug'
});

module.exports = function (moduleName) {
  return logger.child({
    module: moduleName
  });
};