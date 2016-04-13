var passwordHash = require('password-hash'),
  identitySvc = require('./index.js'),
  getUser = identitySvc.getUser,
  updatePassword = identitySvc.updatePassword,
  logger = require('../logger')('identity');

module.exports = function (req, res) {
  var currentPassword = req.body.currentPassword,
    newPassword = req.body.newPassword;

  if (!currentPassword || !newPassword)
    return res.status(400).send('Required: currentPassword, newPassword');

  if (newPassword.length < 10) return res.status(400).send('Minimum password length 10 characters');

  getUser(req.username, function (err, data) {
    //Error response from DynamoDB
    if (err) return res.status(500).send();

    //Validate provided password against hash in db
    if (!data.Item.password) return res.status(500).send('Invalid user object');
    var validPassword = passwordHash.verify(currentPassword, data.Item.password);
    if (!validPassword) return res.status(400).send('Invalid currentPassword');

    //Create and password hash and update db
    var hash = passwordHash.generate(newPassword);
    updatePassword(req.username, hash, function (err) {
      if (err) return res.status(500).send('Unable to change password');
      res.status(204).send();
      logger.info('password changed for user', req.username);
    })
  })
};
