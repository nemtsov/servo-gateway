var async = require('async'),
  actions = require('./actions'),
  express = require('express'),
  routes = require('./routes'),
  buildContext = require('./util').buildContext,
  router = module.exports = express.Router();

Object.keys(routes).forEach(function (route) {
  router.route(route).all(setRequiredPermission.bind(null, routes[route]));
});

function setRequiredPermission(routeInfo, req, res, next) {
  var method = req.method,
    baseParams = req.baseUrl.split('/');
  //TODO Append core url to req
  req.context = {org: baseParams[2]};
  if (req.params.app) {
    req.context.region = process.env.REGION || 'virginia';
    req.context.app = req.params.app;
  }
  if (req.params.stack) req.context.stack = req.params.stack;
  if (req.params.distribution) {
    req.context.type = 'distribution';
    req.context.distribution = req.params.distribution;
    if (req.params.origin) req.context.origin = req.params.origin;
  }
  if (!routeInfo || !routeInfo[method]) return res.status(404).send('Not Found!');
  req.permissionRequired = routeInfo[method];
  next();
}

router.all('*', function (req, res, next) {
  req.identities = [req.username];

  if (!req.permissionRequired) return res.status(404).send('Not Found!');

  var context = buildContext(req.context);

  actions.verify(req.username, context, req.permissionRequired, function (err, permitted) {
    if (err || !permitted) return res.status(403).send('Access Denied!');
    next();
  });
});
