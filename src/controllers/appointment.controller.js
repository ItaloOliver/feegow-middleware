const { parseSlotId, createAppointment } = require('../services/feegowAppointment.service');
const { findOrCreatePatient } = require('../services/feegowPatient.service');

const formatDateTime = (dateIso, time) => {
  const [, month, day] = dateIso.split('-');
  const [hour, minute] = time.split(':');

  return {
    date: `${day}/${month}`,
    time: `${hour}:${minute}`
  };
};

const bookAppointment = async (req, res) => {
  try {
    const { patientName, patientPhone, patientCpf, selectedSlotId } = req.body;

    if (!patientName || !patientPhone || !patientCpf || !selectedSlotId) {
      return res.status(400).json({
        success: false,
        message: 'patientName, patientPhone, patientCpf e selectedSlotId são obrigatórios.'
      });
    }

    const { dateIso, dateFeegow, time, professionalId, localId } = parseSlotId(selectedSlotId);

    const patient = await findOrCreatePatient({
      name: patientName,
      phone: patientPhone,
      cpf: patientCpf
    });

    if (!patient.patientId) {
      return res.status(500).json({
        success: false,
        message: 'Não foi possível identificar ou criar o paciente no Feegow.'
      });
    }

    const appointmentResponse = await createAppointment({
      pacienteId: patient.patientId,
      date: dateFeegow,
      time,
      profissionalId: professionalId,
      localId,
      patientPhone
    });

    if (!appointmentResponse?.success) {
      return res.status(500).json({
        success: false,
        message: 'Não foi possível concluir o agendamento no Feegow.'
      });
    }

    const formatted = formatDateTime(dateIso, time);

    const summaryText = `Perfeito, ${patientName}! Sua avaliação capilar gratuita ficou agendada para o dia ${formatted.date}, às ${formatted.time}, na +Hair Clinic.

📍 Rua Vilela, 652 – Loja 08, Tatuapé

A consulta dura cerca de 30 minutos e temos tolerância de 15 minutos de atraso.

Se quiser, também posso te relembrar os principais detalhes da sua avaliação. 💚`;

    return res.status(200).json({
      success: true,
      appointment: {
        date: formatted.date,
        time: formatted.time,
        patientId: patient.patientId,
        appointmentId: appointmentResponse?.content?.agendamento_id || null
      },
      summaryText
    });
  } catch (error) {
    const feegowMessage = error.response?.data?.content;

    if (
      typeof feegowMessage === 'string' &&
      feegowMessage.includes('já possui um agendamento nessa agenda')
    ) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_APPOINTMENT',
        message: 'Esse paciente já possui um agendamento nessa agenda.',
        errorDetails: error.response?.data || null
      });
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Falha ao criar agendamento no Feegow.',
      errorDetails: error.response?.data || null
    });
  }
};

module.exports = {
  bookAppointment
};