var util = require('util');
var readline = require('readline');
var async = require('async');
var AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient();
var genPassword = require('./passwordGenerator');

var userDb = 'servo-users';
var permissionDb = 'servo-permission';
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


function addUser(email, name, org) {
  var password = genPassword();

  async.auto({
    verify: function (done) {
      docClient.get({
        TableName: userDb,
        Key: { username: email }
      }, function (err, data) {
        if (err) return done(err);
        if (data.Item) return done(new Error('User already exists'));
        console.log('No existing user found.')
        done();
      });
    },
    user: ['verify', function (done) {
      console.log('Adding user:', email)
      docClient.put({
        TableName: userDb,
        Item: {
          username: email,
          name: name,
          password: password.hash
        }
      }, done);
    }],
    permission: ['user', function (done, data) {
      console.log('Adding permissions for:', org);
      docClient.put({
        TableName: permissionDb,
        Item: {
          username: email,
          context: org,
          userrole: 'user'
        }
      }, done)
    }]
  }, function (err, result) {
    if (err) return console.error(err);
    console.log('---Success!')
    console.log('username:', email);
    console.log('password:', password.plaintext);
  })
}


rl.question('Enter email: ', function (email) {
  rl.question('Enter name: ', function  (name) {
    rl.question('Enter org: ', function (org) {
      addUser(email, name, org);
      rl.close();
    });
  });
});
