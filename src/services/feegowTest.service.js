const feegowClient = require('./feegowClient.service');

const listChannels = async () => {
  const response = await feegowClient.get('/appoints/list-channel');
  return response.data;
};

module.exports = {
  listChannels
};