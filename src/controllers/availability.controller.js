const { getRealAvailability, normalizeShift } = require('../services/realAvailability.service');

const searchAvailability = async (req, res) => {
  try {
    const {
      patientName,
      patientPhone,
      preferredWeekday,
      preferredShift,
      attempt = 1,
      lastOfferedAfter = null
    } = req.body;

    if (!patientName || typeof patientName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'patientName é obrigatório.'
      });
    }

    if (!patientPhone || typeof patientPhone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'patientPhone é obrigatório.'
      });
    }

    if (!preferredWeekday || typeof preferredWeekday !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'preferredWeekday é obrigatório.'
      });
    }

    const normalizedShift = normalizeShift(preferredShift);

    if (!normalizedShift || !['manha', 'tarde'].includes(normalizedShift)) {
      return res.status(400).json({
        success: false,
        message: 'preferredShift deve ser manha ou tarde.'
      });
    }

    const result = await getRealAvailability({
      patientName,
      preferredWeekday,
      preferredShift: normalizedShift,
      attempt: Number(attempt),
      lastOfferedAfter
    });

    return res.status(200).json({
      requestedBy: {
        patientName,
        patientPhone
      },
      ...result
    });
  } catch (error) {
    console.error('ERRO REAL NO /availability/search');
    console.error('status:', error.response?.status);
    console.error('data:', error.response?.data);
    console.error('message:', error.message);
    console.error('stack:', error.stack);

    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Falha ao buscar disponibilidade.',
      errorStatus: error.response?.status || 500,
      errorMessage: error.message,
      errorDetails: error.response?.data || null
    });
  }
};

module.exports = {
  searchAvailability
};
