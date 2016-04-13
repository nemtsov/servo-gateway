var Dynamo = require("dynamodb-doc"),
  db = new Dynamo.DynamoDB(),
  speakeasy = require('speakeasy'),
  getUser = require('./index.js').getUser;

module.exports = function (req, res) {
  getUser(req.username, function (err, data) {
    //Error response from DynamoDB
    if (err) return res.status(500).send();

    //User already has MFA configured
    if (data.Item.key) return res.status(400).send('MFA already configured');

    //Create and return new MFA key to user
    var key = speakeasy.generate_key({google_auth_qr: true, name: 'Servo'});
    db.updateItem({
      TableName: 'servo-users',
      Key: {username: req.username},
      UpdateExpression: "set #a = :x",
      ExpressionAttributeNames: {"#a" : "key"},
      ExpressionAttributeValues: {":x" : key.base32}
    }, function (err) {
      if (err) return res.status(500).send('Unable to configure mfa');
      res.json({key: key.base32});
    })
  })
};
