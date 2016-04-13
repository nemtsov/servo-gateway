var url = require('url'),
  querystring = require('querystring'),
  request = require('request'),
  region = process.env.REGION,
  orgs = JSON.parse(process.env.RAW_CONFIG)[region];

module.exports = function (req, res) {
  //Validate org
  if (!orgs) return res.status(400).send(['Invalid Config Env Variable!', JSON.stringify(process.env.RAW_CONFIG, null, 2), region].join('\n'));
  if (!orgs[req.params.org]) return res.status(400).send('Invalid org');

  proxyRequest(req, function (err, response, body) {
    if (err) return res.status(500).send('Gateway Error: ' + err.message);
    res.set(response.headers).status(response.statusCode).send(body);
  });
};

module.exports.proxyRequest = proxyRequest;

function proxyRequest (req, cb) {
  var requestedUrl = url.parse(req.url),
    requestedPath = requestedUrl.pathname.replace(/\/orgs\/[^\/]*/, ''),
    query = querystring.parse(requestedUrl.query),
    proxyUrl = orgs[req.params.org].endpoint + requestedPath;

  //Remove token from request proxied to core
  delete query.token;

  //Make request to core and send response on to client
  request({
    method: req.method,
    url: proxyUrl,
    qs: query,
    body: req.body,
    json: true,
    timeout: 10000,
    headers: {}
  }, cb);
}
