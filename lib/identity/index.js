var Dynamo = require("dynamodb-doc"),
  AWS = require("aws-sdk");

AWS.config.update({region: "us-east-1"});

var db = new Dynamo.DynamoDB();

module.exports.getUser = function (username, cb) {
  db.getItem({
    TableName: 'servo-users',
    Key: {username: username}
  }, cb);
};

module.exports.updatePassword = function (username, passwordHash, cb) {
  db.updateItem({
    TableName: 'servo-users',
    Key: {username: username},
    UpdateExpression: "set #a = :x",
    ExpressionAttributeNames: {"#a" : "password"},
    ExpressionAttributeValues: {":x" : passwordHash}
  }, cb);
};
