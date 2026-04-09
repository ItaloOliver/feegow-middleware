const axios = require('axios');
const env = require('../config/env');

const feegowClient = axios.create({
  baseURL: env.feegowBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'x-access-token': env.feegowAccessToken
  },
  timeout: 15000
});

module.exports = feegowClient;