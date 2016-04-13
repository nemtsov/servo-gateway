if (!process.env.TOKEN_SECRET) {
  throw new Error('INSECURE! Please specify TOKEN_SECRET env variable')
}

try {
  JSON.parse(process.env.RAW_CONFIG);
} catch(e) {
  throw new Error('Please specify a valid RAW_CONFIG env variable');
}

var express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  specialRoutes = require('./lib/proxy/specialRouteHandle'),
  permission = require('./lib/permission/resource'),
  cors = require('cors');

app.disable('x-powered-by');
app.use(require('./lib/logger/middleware'));
app.use(cors({exposedHeaders: ['Next']}));
app.options('*', cors({exposedHeaders: ['Next']}));
app.use(bodyParser.json());
app.get('/_health', function (req, res) {
  res.status(200).send("Ok");
});
app.post('/users/me/sessions', require('./lib/identity/login'));
app.use(require('./lib/identity/authentication'));

app.get('/users/me/tokens', require('./lib/identity/resource').getAll);
app.post('/users/me/tokens', require('./lib/identity/resource').post);
app.delete('/users/me/tokens/:tokenName', require('./lib/identity/resource').del);

app.get('/users/me/mfa', require('./lib/identity/mfa'));
app.get(function (req, res, next) {
  //This enforces MFA on all requests that pass this middleware
  (!req.mfa) ? res.status(401).send('MFA is required') : next();
  (!req.verified) ? res.status(401).send('Invalid Token!') : next();
});
app.post('/users/me/password', require('./lib/identity/password'));
app.use('/orgs/:org',require('./lib/permission').middleware);

app.get('/users/me/preferences/:key', require('./lib/preferences').getPreference);
app.put('/users/me/preferences/:key', require('./lib/preferences').setPreference);
app.delete('/users/me/preferences/:key', require('./lib/preferences').deletePreference);

//Distributions add and remove
app.post('/orgs/:org/distributions', specialRoutes.postDistribution);
app.delete('/orgs/:org/distributions/:distribution', specialRoutes.deleteDistribution);

// Origins add and remove
app.post('/orgs/:org/distributions/:distribution/origins', specialRoutes.postDistribution);
app.delete('/orgs/:org/distributions/:distribution/origins/:origin', specialRoutes.deleteDistribution);

//App add and remove
app.post('/orgs/:org/apps', specialRoutes.post);
app.delete('/orgs/:org/apps/:app', specialRoutes.delete);

//Stack add and remove
app.post('/orgs/:org/apps/:app/stacks', specialRoutes.post);
app.delete('/orgs/:org/apps/:app/stacks/:stack', specialRoutes.delete);

// Org level permission add and remove
app.get('/orgs/:org/permissions', permission.get);
app.get('/orgs/:org/permissions/:user', permission.getOne);
app.post('/orgs/:org/permissions', permission.update);
app.put('/orgs/:org/permissions/:user', permission.update);
app.delete('/orgs/:org/permissions/:user', permission.delete);

//App level permission add, update and remove
app.get('/orgs/:org/apps/:app/permissions', permission.get);
app.post('/orgs/:org/apps/:app/permissions', permission.update);
app.get('/orgs/:org/apps/:app/permissions/:user', permission.getOne);
app.put('/orgs/:org/apps/:app/permissions/:user', permission.update);
app.delete('/orgs/:org/apps/:app/permissions/:user', permission.delete);

//Stack level permission add and remove
app.get('/orgs/:org/apps/:app/stacks/:stack/permissions', permission.get);
app.post('/orgs/:org/apps/:app/stacks/:stack/permissions', permission.update);
app.get('/orgs/:org/apps/:app/stacks/:stack/permissions/:user', permission.getOne);
app.put('/orgs/:org/apps/:app/stacks/:stack/permissions/:user', permission.update);
app.delete('/orgs/:org/apps/:app/stacks/:stack/permissions/:user', permission.delete);

//Distribution level permission add & remove
app.get('/orgs/:org/distributions/:distribution/permissions', permission.get);
app.post('/orgs/:org/distributions/:distribution/permissions', permission.update);
app.put('/orgs/:org/distributions/:distribution/permissions/:user', permission.update);
app.delete('/orgs/:org/distributions/:distribution/permissions/:user', permission.delete);

//Origin level permission add & remove
app.get('/orgs/:org/distributions/:distribution/origins/:origin/permissions', permission.get);
app.post('/orgs/:org/distributions/:distribution/origins/:origin/permissions', permission.update);
app.put('/orgs/:org/distributions/:distribution/origins/:origin/permissions/:user', permission.update);
app.delete('/orgs/:org/distributions/:distribution/origins/:origin/permissions/:user', permission.delete);

app.all('/orgs/:org/*', require('./lib/proxy'));
// app.use(require('./lib/errorHandler'));
app.listen(process.env.PORT || 4500);
