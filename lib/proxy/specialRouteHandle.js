var proxyRequest = require('./index').proxyRequest,
  addPermission = require('../permission').add,
  removePermission = require('../permission').remove,
  buildContext = require('../permission/util').buildContext;

module.exports.post = function (req, res) {
  proxyRequest(req, function (err, response, body) {
    if (err) return res.status(500).send('Gateway Error: ' + err.message);
    res.set(response.headers).status(response.statusCode).send(body);
    if (response.statusCode === 200) {
      var context = req.context,
        parsedBody = body;
      if (!context.region) context.region = process.env.REGION || 'virginia';
      if (context.app) context.stack = parsedBody.handle;
      else context.app = parsedBody.handle;
      addPermission(req.username, buildContext(context), 'owner', function (err) {
        if (err) console.error(err);
      });
    }
  });
};

module.exports.postDistribution = function (req, res) {
  proxyRequest(req, function (err, response, body) {
    if (err) return res.status(500).send('Gateway Error: ' + err.message);
    res.set(response.headers).status(response.statusCode).send(body);
    if (response.statusCode === 200) {
      var context = req.context,
        parsedBody = body;
      if (!context.type) context.type = 'distribution';
      if (context.distribution) context.origin = parsedBody.id;
      else context.distribution = parsedBody.id;
      addPermission(req.username, buildContext(context), 'owner', function (err) {
        if (err) console.error(err);
      });
    }
  });
}

module.exports.delete = function (req, res) {
  proxyRequest(req, function (err, response, body) {
    if (err) return res.status(500).send('Gateway Error: ' + err.message);
    res.set(response.headers).status(response.statusCode).send(body);
    if (response.statusCode === 204) {
      removePermission(null, buildContext(req.context), function (err, results) {
        if (err) console.error(err);
      });
    }
  });
};

module.exports.deleteDistribution = function (req, res) {
  proxyRequest(req, function (err, response, body) {
    if (err) return res.status(500).send('Gateway Error: ' + err.message);
    res.set(response.headers).status(response.statusCode).send(body);
    if (response.statusCode === 204) {
      removePermission(null, buildContext(req.context), function (err, results) {
        if (err) console.error(err);
      });
    }
  });
};
