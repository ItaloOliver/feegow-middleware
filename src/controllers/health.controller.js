const env = require('../config/env');

const getHealth = (req, res) => {
  return res.status(200).json({
    ok: true,
    service: env.appName,
    environment: env.nodeEnv,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealth
};