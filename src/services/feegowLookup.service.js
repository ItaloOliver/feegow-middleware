const feegowClient = require('./feegowClient.service');

const listProfessionals = async () => {
  const response = await feegowClient.get('/professional/list');
  return response.data;
};

const listUnits = async () => {
  const response = await feegowClient.get('/company/list-unity');
  return response.data;
};

const listLocals = async () => {
  const response = await feegowClient.get('/company/list-local');
  return response.data;
};

const listSpecialties = async () => {
  const response = await feegowClient.get('/specialties/list');
  return response.data;
};

const listProcedures = async () => {
  const response = await feegowClient.get('/procedures/list');
  return response.data;
};

module.exports = {
  listProfessionals,
  listUnits,
  listLocals,
  listSpecialties,
  listProcedures
};