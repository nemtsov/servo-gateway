var Dynamo = require('dynamodb-doc'),
  AWS = require("aws-sdk");

AWS.config.update({region: "us-east-1"});
var db = new Dynamo.DynamoDB();

exports.getPreference = function (req, res) {
  var key = req.params.key;
  db.getItem({
    TableName: "servo-preferences",
    Key: {
      username: req.username,
      key: key
    }
  }, function (err, result) {
    if (err) return res.status(500).send(err);
    if (!result.Item) return res.json({key: key, value: null});
    res.json({key: key, value: result.Item.value});
  });
};

exports.setPreference = function (req, res) {
  var key = req.params.key,
    value = req.body.value;
  if (!value) return res.status(400).send('value must be specified');
  db.putItem({
    TableName: "servo-preferences",
    Item: {
      username: req.username,
      key: key,
      value: value
    }
  }, function (err) {
    if (err) return res.status(500).send(err);
    res.json({key: key, value: value});
  });
};

exports.deletePreference = function (req, res) {
  var key = req.params.key;
  db.putItem({
    TableName: "servo-preferences",
    Item: {
      username: req.username,
      key: key,
      value: null
    }
  }, function (err) {
    if (err) return res.status(500).send(err);
    res.json({key: key, value: null});
  });
};
