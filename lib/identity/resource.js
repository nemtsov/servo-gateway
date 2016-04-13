var pat = require('./personalAccessToken');

module.exports.getAll = function findAllTokens (req, res, next) {
  pat.getAllTokens(req.username, function (err, tokens) {
    if (err) return res.status(500).json(err);
    res.json(tokens);
  });
}

module.exports.post = function createToken (req, res, next) {
  var tokenName = req.body.name;
  if (!tokenName) return res.status(400).json({error: 'Input error: name is required'});
  pat.createToken(req.username, tokenName, function (err, token) {
    if (err && err.status === 'fail') return res.status(409).json(err);
    if (err) return res.status(500).json(err);
    res.json(token);
  });
}

module.exports.del = function removeToken (req, res, next) {
  var tokenName = req.params.tokenName;
  pat.removeToken(req.username, tokenName, function (err) {
    if (err && err.status === 'fail') return res.status(404).json(err);
    if (err) return res.status(500).json(err);
    res.status(204).json();
  });
}
