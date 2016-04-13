var async = require('async'),
  errors = require('common-errors'),
  cache = require('memory-cache'),
  Dynamo = require('dynamodb-doc'),
  logger = require('../logger')('permission'),
  parseContext = require('./util').parseContext,
  AWS = require("aws-sdk"),
  DEBUG = process.env.DEBUG;

AWS.config.update({region: "us-east-1"});

var db = new Dynamo.DynamoDB();

function getPermissionsFromCache (user, contexts, cb) {
  async.map(contexts, function (context, done) {
    var userrole = cache.get('permission:' + user + context) || null;
    done(null, {context: context, userrole: userrole});
  }, function (err, cachedPermissions) {
    cb(null, cachedPermissions.filter(function (permission) {
      return permission.userrole;
    }));
  });
}

function cacheInsert (user, permission) {
  if (DEBUG) logger.debug('cacheInsert' ,user, permission);
  cache.put('permission:' + user + permission.context, permission.userrole, 15000, cacheRefresh.bind(null, user, permission.context));
}

function cacheRefresh (user, context) {
  if (DEBUG) logger.debug('cacheRefresh' ,user, context);
  var lastAccess = cache.get('access:' + user);
  if (new Date().valueOf() - lastAccess > '60000') return null;
  db.getItem({
    TableName: "servo-permission",
    Key: {
      username: user,
      context: context
    }
  }, function (err, result) {
    if (err) return logger.error('Can not refresh permission for user', user, 'context', context, err);
    if (Object.keys(result).length === 0)
      result = {Item: {username:user, context: context, userrole: null}};
    cacheInsert(user, result.Item);
  });
}

function getPermissionsFromDynamo (user, contexts, cb) {
  var query = {
    TableName: 'servo-permission'
  };

  function queryDynamo (query, cb) {
    db.getItem(query, function (err, item){
      if (err) return cb(err);
      cb(null, item);
    });
  }

  async.map(contexts, function (context, done) {
    var q = {
      TableName: query.TableName,
      Key: {
        username: user,
        context: context
      }
    };
    if (q.Key.context.length === 0) delete q.Key.context;
    queryDynamo(q, done);
  }, function (err, permissions) {
    if (err) {
      if (cb) return cb(err);
      return logger.error('DynamoDB', err);
    }
    permissions = permissions.map(function (permission, index) {
      if (Object.keys(permission).length === 0) return {context: contexts[index], userrole: null};
      return permission.Item;
    });
    async.each(permissions, function (permission, done) {
      cacheInsert(user, permission);
      done();
    }, function (err) {
      if (cb) cb(null, permissions);
    });
  });
}

module.exports.get = function get (user, context, cb) {
  var validContexts = parseContext(context);
  async.auto({
    cached: getPermissionsFromCache.bind(null, user, validContexts),
    permissions: ['cached', function (done, permissions) {
      if (validContexts.length === permissions.cached.length) return done(null, permissions.cached);
      var cachedPermissions = {};
      permissions.cached.forEach(function (permission) {
        cachedPermissions[permission.context] = permission;
      });
      var missingContexts = validContexts.filter(function (context) {return !cachedPermissions[context];});
      getPermissionsFromDynamo(user, missingContexts, function (err, permissionsInDb) {
        if (err) return done(err);
        done(null, permissions.cached.concat(permissionsInDb).filter(function (permission) {
          return permission.userrole;
        }));
      });
    }]
  }, function (err, results) {
    if (DEBUG) logger.debug('get permission' ,user, context, results.permissions);
    cb(err, results.permissions);
  });
};


module.exports.verify = function verify (user, context, requiredRoles, cb) {
  cache.put('access:' + user, new Date().valueOf());
  var validContexts = parseContext(context);
  async.auto({
    cached: getPermissionsFromCache.bind(null, user, validContexts),
    cacheHit: ['cached', function (done, permissions) {
      var cacheHit = permissions.cached.reduce(function (permitted, permission) {
        return permitted || (requiredRoles.indexOf(permission.userrole) !== -1);
      }, false);
      if (cacheHit) {
        cb(null, true);
      }
      done(null, cacheHit);
    }],
    permissions: ['cached', function (done, permissions) {
      if (validContexts.length === permissions.cached.length) return done(null, permissions.cached);
      var cachedPermissions = {};
      permissions.cached.forEach(function (permission) {
        cachedPermissions[permission.context] = permission;
      });
      var missingContexts = validContexts.filter(function (context) {return !cachedPermissions[context];});
      if (DEBUG) logger.debug('queryDynamo', user, missingContexts);
      getPermissionsFromDynamo(user, missingContexts, function (err, permissionsInDb) {
        if (err) return done(err);
        done(null, permissions.cached.concat(permissionsInDb).filter(function (permission) {
          return permission.userrole;
        }));
      });
    }],
    permitted: ['permissions', function (done, results) {
      if (DEBUG) logger.debug('permissions retrieved', results.permissions);
      var permitted = results.permissions.reduce(function (permitted, permission) {
        return permitted || (requiredRoles.indexOf(permission.userrole) !== -1);
      }, false);
      done(null, permitted);
    }]
  }, function (err, results) {
    if (!results.cacheHit) return cb(err, results.permitted);
    if (err) logger.error('Error when verify', user, context, requiredRoles, err);
  });
};


module.exports.getByContext = function getByContext (context, cb) {
  var more = true,
    permissions = [],
    query = {
      TableName: "servo-permission",
      FilterExpression: 'context = :context AND userrole <> :user',
      ExpressionAttributeValues: {
        ':context': context,
        ':user': 'user'
      },
      Limit: 100
    };
  async.whilst(function () {
    return more;
  }, function (done) {
    db.scan(query, function (err, result) {
      if (err) return done(err);
      permissions = permissions.concat(result.Items);
      if (result.LastEvaluatedKey)
        query.ExclusiveStartKey = result.LastEvaluatedKey;
      else
        more = false;
      done();
    });
  }, function (err) {
    if (err) return logger.error('DynamoDB error when get permissions by context', context, err);
    cb(null, permissions);
  });
};

module.exports.add = function add (user, context, role, cb) {
  if (DEBUG) logger.debug('add permission' ,user, context, role);
  db.updateItem({
    TableName: 'servo-permission',
    Key: {
      username: user,
      context: context,
    },
    UpdateExpression: "set userrole = :role",
    ExpressionAttributeValues: {':role': role}
  }, function (err, result) {
    if (err) return cb(err);
    cacheInsert(user, {username: user, context: context, userrole: role});
    cb(null, result.ItemCollectionMetrics);
  });
};

function batchRemove(items, cb) {
  var more = true,
    retry = 0,
    request = {
      RequestItems: {
        "servo-permission": items.map(function (item) {
          delete item.userrole;
          return {DeleteRequest: {Key: item}};
        })
      }
    };

  async.whilst(function () {
    return more;
  }, function (done) {
    db.batchWriteItem(request, function (err, result) {
      if (err) return done(err);
      if (Object.keys(result.UnprocessedItems).length) {
        request.RequestItems = result.UnprocessedItems;
        return setTimeout(done, 5000);
      }
      more = false;
      done();
    });
  }, cb);
}

function removeByUser(user, cb) {
  var more = true,
    query = {
      TableName: "servo-permission",
      KeyConditionExpression: 'username = :username and context > :context',
      ExpressionAttributeValues: {
        ':username': user,
        ':context': ''
      },
      Limit: 25
    };
  async.whilst(function () {
    return more;
  }, function (done) {
    db.query(query, function (err, result) {
      if (err) return done(err);
      batchRemove(result.Items, function (err) {
        if (err) return done(err);
        if (result.LastEvaluatedKey)
          query.ExclusiveStartKey = result.LastEvaluatedKey;
        else
          more = false;
        done();
      });
    });
  }, function (err) {
    if (err) logger.error('DynamoDB error when remove permissions by user', user, err);
    async.each(cache.keys(), function (key, done) {
      if (key.indexOf(user) !== -1) cache.del(key);
      done();
    }, function () {
      cb(err);
    });
  });
}

function removeByContext(context, cb) {
  var more = true,
    query = {
      TableName: 'servo-permission',
      FilterExpression: 'context = :context',
      ExpressionAttributeValues: {
        ':context': context
      },
      Limit: 100
    };

  async.whilst(function () {
    return more;
  }, function (done) {
    db.scan(query, function (err, result) {
      if (err) return done(err);
      if (result.LastEvaluatedKey) {
        query.ExclusiveStartKey = result.LastEvaluatedKey;
      } else {
        more = false;
      }
      if (result.Items.length === 0) return done();
      batchRemove(result.Items, function (err) {
        if (err) return done(err);
        done();
      });
    });
  }, function (err) {
    if (err) return logger.error('DynamoDB error when remove permissions by context', context, err);
    async.each(cache.keys(), function (key, done) {
      if (key.indexOf(context) !== -1) cache.del(key);
      done();
    }, function () {
      cb(err);
    });
  });
}

module.exports.remove = function remove (user, context, cb) {
  if (DEBUG) logger.debug('remove permission' ,user, context);
  if (user && context)
    return db.deleteItem({
      TableName: 'servo-permission',
      Key: {
        username: user,
        context: context
      }
    }, function (err) {cb(err);});
  if (user)
    return removeByUser(user, cb);

  removeByContext(context, cb);
};
