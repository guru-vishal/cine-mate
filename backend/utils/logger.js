const { createLogger, format, transports } = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({ node: 'http://localhost:9200' });

const esTransport = new ElasticsearchTransport({
  level: 'info',
  client: esClient,
  indexPrefix: 'cinemate-logs',
});

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    esTransport
  ],
});

module.exports = logger;
