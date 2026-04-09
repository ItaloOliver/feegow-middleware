const { getAvailableSchedule } = require('../services/feegowAvailability.service');

const getAvailableScheduleTest = async (req, res) => {
  try {
    const {
      tipo = 'P',
      procedimento_id,
      especialidade_id,
      data_start,
      data_end,
      unidade_id,
      profissional_id
    } = req.query;

    const data = await getAvailableSchedule({
      tipo,
      procedimentoId: procedimento_id ? Number(procedimento_id) : undefined,
      especialidadeId: especialidade_id ? Number(especialidade_id) : undefined,
      dataStart: data_start,
      dataEnd: data_end,
      unidadeId: typeof unidade_id !== 'undefined' ? Number(unidade_id) : undefined,
      profissionalId: typeof profissional_id !== 'undefined' ? Number(profissional_id) : undefined
    });

    return res.status(200).json({
      success: true,
      message: 'Disponibilidade carregada com sucesso.',
      feegowResponse: data
    });
  } catch (error) {
    const { status, details } = buildErrorResponse(error);

    return res.status(status).json({
      success: false,
      message: 'Falha ao buscar disponibilidade no Feegow.',
      details
    });
  }
};

const {
  listChannels
} = require('../services/feegowTest.service');

const {
  listProfessionals,
  listUnits,
  listLocals,
  listSpecialties,
  listProcedures
} = require('../services/feegowLookup.service');

const buildErrorResponse = (error) => {
  const status = error.response?.status || 500;
  const details = error.response?.data || error.message;

  return { status, details };
};

const testFeegowConnection = async (req, res) => {
  try {
    const data = await listChannels();

    return res.status(200).json({
      success: true,
      message: 'Conexão com Feegow funcionando.',
      feegowResponse: data
    });
  } catch (error) {
    const { status, details } = buildErrorResponse(error);

    return res.status(status).json({
      success: false,
      message: 'Falha ao conectar com o Feegow.',
      details
    });
  }
};

const getProfessionals = async (req, res) => {
  try {
    const data = await listProfessionals();

    return res.status(200).json({
      success: true,
      message: 'Profissionais carregados com sucesso.',
      feegowResponse: data
    });
  } catch (error) {
    const { status, details } = buildErrorResponse(error);

    return res.status(status).json({
      success: false,
      message: 'Falha ao buscar profissionais no Feegow.',
      details
    });
  }
};

const getUnits = async (req, res) => {
  try {
    const data = await listUnits();

    return res.status(200).json({
      success: true,
      message: 'Unidades carregadas com sucesso.',
      feegowResponse: data
    });
  } catch (error) {
    const { status, details } = buildErrorResponse(error);

    return res.status(status).json({
      success: false,
      message: 'Falha ao buscar unidades no Feegow.',
      details
    });
  }
};

const getLocals = async (req, res) => {
  try {
    const data = await listLocals();

    return res.status(200).json({
      success: true,
      message: 'Locais carregados com sucesso.',
      feegowResponse: data
    });
  } catch (error) {
    const { status, details } = buildErrorResponse(error);

    return res.status(status).json({
      success: false,
      message: 'Falha ao buscar locais no Feegow.',
      details
    });
  }
};

const getSpecialties = async (req, res) => {
  try {
    const data = await listSpecialties();

    return res.status(200).json({
      success: true,
      message: 'Especialidades carregadas com sucesso.',
      feegowResponse: data
    });
  } catch (error) {
    const { status, details } = buildErrorResponse(error);

    return res.status(status).json({
      success: false,
      message: 'Falha ao buscar especialidades no Feegow.',
      details
    });
  }
};

const getProcedures = async (req, res) => {
  try {
    const data = await listProcedures();

    return res.status(200).json({
      success: true,
      message: 'Procedimentos carregados com sucesso.',
      feegowResponse: data
    });
  } catch (error) {
    const { status, details } = buildErrorResponse(error);

    return res.status(status).json({
      success: false,
      message: 'Falha ao buscar procedimentos no Feegow.',
      details
    });
  }
};

module.exports = {
  testFeegowConnection,
  getProfessionals,
  getUnits,
  getLocals,
  getSpecialties,
  getProcedures,
  getAvailableScheduleTest
};