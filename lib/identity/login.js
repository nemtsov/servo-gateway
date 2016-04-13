var passwordHash = require('password-hash'),
  jwt = require('jsonwebtoken'),
  tokenSecret = process.env.TOKEN_SECRET,
  speakeasy = require('speakeasy'),
  getUser = require('./index.js').getUser;

module.exports = function (req, res) {
  var username = req.body.username || req.body.user,
    password = req.body.password || req.body.pass,
    mfa = req.body.mfa;

  if (!username || !password)
    return res.status(400).send('Username, password, and mfa are required');

  getUser(username, function (err, data) {
    //Error response from DynamoDB
    if (err) return res.status(500).send('Unable to authenticate');
    //Username not found in db
    if (!data.Item) return res.status(401).send('Invalid credentials');
    var name = data.Item.name;

    //Validate provided password against hash in db
    if (!data.Item.password) return res.status(500).send('Invalid user object');
    var validPassword = passwordHash.verify(password, data.Item.password);
    if (!validPassword) return res.status(401).send('Invalid credentials');

    //Validate MFA
    var tempToken = jwt.sign({username: username, mfa: false}, tokenSecret, {expiresInMinutes: 60});
    if (!data.Item.key) return res.json({token: tempToken, username: username, name: name, mfa: false});
    var totpNow = speakeasy.totp({key: data.Item.key, encoding: 'base32'});
    var totpPrevious = speakeasy.totp({key: data.Item.key, encoding: 'base32', time: (parseInt(new Date()/1000) - 30)});
    var totpNext = speakeasy.totp({key: data.Item.key, encoding: 'base32', time: (parseInt(new Date()/1000) + 30)});
    if (totpNow !== mfa && totpPrevious !== mfa && totpNext !== mfa) return res.status(401).send('Invalid credentials');

    //Create and respond with token
    var token = jwt.sign({username: username, mfa: true}, tokenSecret, {expiresInMinutes: 720});
    res.json({token: token, username: username, name: name, mfa: true});
  })
};
