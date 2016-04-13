var Dynamo = require("dynamodb-doc"),
  async = require('async'),
  crypto = require('crypto'),
  AWS = require("aws-sdk"),
  DEBUG = process.env.DEBUG;

AWS.config.update({region: "us-east-1"});

var db = new Dynamo.DynamoDB();

module.exports.createToken = function (userName, tokenName, cb) {
  tokenName = tokenName.replace(/\s+/g,'_');
  tokenName = tokenName.replace(/[^a-zA-Z0-9_]/g, '');
  if (tokenName.length < 1)
    return cb({
      status: 'fail',
      error: 'Token name can only consists alphabet, number and _'
    });
  async.auto({
    verify: function (done) {
      db.getItem({
        TableName: 'servo-user-access-tokens',
        Key: {username: userName, tokenname: tokenName}
      }, function (err, result) {
        if (err) return done(err);
        if (result.Item) return done({
          status: 'fail',
          error: 'Key with name \'' + tokenName + '\' already exists'
        });
        done();
      });
    },
    secret: ['verify', function (done, results) {
      crypto.randomBytes(5, function (err, buf) {
        if (err) return done(err);
        done(null, buf.toString('hex'));
      })
    }],
    token: ['secret', function (done, results) {
      var cipher = crypto.createCipher('aes256', process.env.TOKEN_SECRET),
        token = null;

      token = cipher.update(userName + ':' + tokenName + ':' + results.secret, 'utf8', 'base64');
      token += cipher.final('base64');
      token = 'pat:' + token;
      done(null, token);
    }],
    save: ['token', function (done, results) {
      var token = results.token;
      db.updateItem({
        TableName: 'servo-user-access-tokens',
        Key: {
          username: userName,
          tokenname: tokenName,
        },
        UpdateExpression: "set secret = :secret, accesstoken = :accesstoken",
        ExpressionAttributeValues: {':secret': results.secret, ':accesstoken': results.token}
      }, done);
    }]
  }, function (err, results) {
    if (err) return cb(err);
    cb(null, {name: tokenName, val: results.token});
  });
};

module.exports.removeToken = function (userName, tokenName, cb) {
  if (DEBUG) logger.debug('remove token', user, context);
  db.deleteItem({
    TableName: 'servo-user-access-tokens',
    Key: {
      username: userName,
      tokenname: tokenName
    },
    ReturnValues: 'ALL_OLD'
  }, function (err, data) {
    // How do you identify if tokenName did not exist?
    if (!data.Attributes) return cb({
      status: 'fail',
      error: 'TokenName: \'' + tokenName +'\' not found!'
    });
    cb(err);
  });
};

module.exports.getAllTokens = function (userName, cb) {
  if (DEBUG) logger.debug('get all tokens for username', userName);
  var more = true,
    tokens = [],
    query = {
      TableName: "servo-user-access-tokens",
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': userName
      },
      Limit: 25
    };

  async.whilst(function () {
    return more;
  }, function (done) {
    db.query(query, function (err, result) {
      if (err) return done(err);
      if (result.LastEvaluatedKey)
        query.ExclusiveStartKey = result.LastEvaluatedKey;
      else
        more = false;
      tokens = tokens.concat(result.Items.map(function (item) {return {name: item.tokenname, val: item.accesstoken}}));
      done();
    });
  }, function (err) {
    if (err) return cb(err);
    cb(null, tokens);
  });
};

module.exports.verify = function (token, tokenSecret, cb) {
  var decipher = crypto.createDecipher('aes256', process.env.TOKEN_SECRET);

  token = token.substring(4);
  token = decipher.update(token, 'base64', 'utf8');
  token += decipher.final('utf8');
  token = token.split(':');

  db.getItem({
    TableName: 'servo-user-access-tokens',
    Key: {username: token[0], tokenname: token[1]}
  }, function (err, result) {
    if (err) return cb(err);
    if (!result.Item) return cb({status: 'fail', error: 'Invalid Token'});
    if (!token[2].match(result.Item.secret)) return cb(null, {});
    cb(null, {username: token[0]});
  });
};
