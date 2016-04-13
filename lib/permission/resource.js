var permission = require('./index'),
  logger = require('../logger')('permission'),
  buildContext = require('./util').buildContext,
  getUser = require('../identity').getUser;

module.exports.get = function (req, res) {
  var context = buildContext(req.context);
  permission.getByContext(context, function (err, contexts) {
    if (err) return res.status(500).send('Gateway Error: ' + err.message);
    res.json(contexts);
  });
};

module.exports.getOne = function(req, res) {
  var username = req.params.user,
    context = buildContext(req.context);
    getUser(username, function(err, user) {
      if (err || Object.keys(user).length === 0) return res.status(400).send('The user has not registered yet');
      permission.get(username, context, function (err, result) {
          if (err) return res.status(500).send('Gateway Error: ' + err.message);
          res.send(result);
      });
    });
}

module.exports.delete = function (req, res) {
  var username = req.params.user,
    context = buildContext(req.context);

  getUser(username, function (err, user) {
    if (err || Object.keys(user).length === 0) return res.status(400).send('The user has not registered yet');
    permission.remove(username, context, function (err) {
      if (err) return res.status(500).send('Gateway Error: ' + err.message);
      logger.info('permission removed by', req.username, {username: username, context: context});
      res.status(204).json();
    });
  });
};

module.exports.update = function (req, res) {
  var username = req.params.user || req.body.username,
    userrole = req.body.userrole,
    context = buildContext(req.context);

  if (!userrole) return res.status(400).send('Input Error: userrole required');
  if (!username) return res.status(400).send('Input Error: username required');

  getUser(username, function (err, user) {
    if (err || Object.keys(user).length === 0) return res.status(400).send('The user has not registered yet');
    permission.add(username, context, req.body.userrole, function (err) {
      if (err) return res.status(500).send('Gateway Error: ' + err.message);
      logger.info('permission updated by', req.username, {username: username, context: context, userrole: userrole});
      res.json({username: username, context: context, userrole: userrole});
    });
  });
};
