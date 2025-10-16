const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
require('dotenv').config();

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTIC_URL || 'http://localhost:9200',
    auth: {
      username: process.env.ELASTIC_USERNAME || 'elastic',
      password: process.env.ELASTIC_PASSWORD || 'changeme',
    },
  },
  indexPrefix: 'movieapp-logs',
};

const esTransport = new ElasticsearchTransport(esTransportOpts);

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    esTransport,
  ],
});

module.exports = logger;
