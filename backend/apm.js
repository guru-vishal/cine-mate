const apm = require('elastic-apm-node').start({
  serviceName: 'movie-recommendation-api',
  serverUrl: 'http://localhost:8200',
  active: true,
});
