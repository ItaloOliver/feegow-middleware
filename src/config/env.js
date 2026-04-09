const dotenv = require('dotenv');

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  port: toNumber(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'leadconnector-feegow-api',
  feegowBaseUrl: process.env.FEEGOW_BASE_URL || '',
  feegowAccessToken: process.env.FEEGOW_ACCESS_TOKEN || '',
  leadconnectorBaseUrl: process.env.LEADCONNECTOR_BASE_URL || '',
  leadconnectorAccessToken: process.env.LEADCONNECTOR_ACCESS_TOKEN || '',
  leadconnectorLocationId: process.env.LEADCONNECTOR_LOCATION_ID || ''
};

module.exports = env;