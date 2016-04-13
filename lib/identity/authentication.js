var jwt = require('jsonwebtoken'),
  pat = require('./personalAccessToken'),
  tokenSecret = process.env.TOKEN_SECRET;

function handleAuthenticationResult (req, res, next, token, err, payload) {
  if (err || !payload) return res.status(401).send('Invalid token');
  var username = payload.username;
  if (!username) return res.status(401).send('Invalid token');
  req.username = username;
  req.mfa = (payload.mfa);
  req.verified = true;
  req.token = token;
  next();
}

module.exports = function (req, res, next) {
  var token = req.query.token || req.headers.token;
  if (!token) return res.status(401).send('Token required');
  var cb = handleAuthenticationResult.bind(null, req, res, next, token);
  if (token.match(/^pat:/))
    return pat.verify(token, tokenSecret, cb);
  jwt.verify(token, tokenSecret, cb);
};
