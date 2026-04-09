const { getRealAvailability, normalizeShift } = require('../services/realAvailability.service');

const searchAvailability = async (req, res, next) => {
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
    return next(error);
  }
};

module.exports = {
  searchAvailability
};
