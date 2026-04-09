const feegowClient = require('./feegowClient.service');

const parseSlotId = (slotId) => {
  const [datetime, professionalId, localId] = slotId.split('|');
  const [dateIso, time] = datetime.split('T');
  const [year, month, day] = dateIso.split('-');

  return {
    dateIso,
    dateFeegow: `${day}-${month}-${year}`,
    time,
    professionalId: Number(professionalId),
    localId: Number(localId)
  };
};

const createAppointment = async ({
  pacienteId,
  date,
  time,
  profissionalId,
  localId,
  patientPhone = '',
  patientEmail = ''
}) => {
  const response = await feegowClient.post('/appoints/new-appoint', {
    local_id: localId,
    paciente_id: pacienteId,
    profissional_id: profissionalId,
    especialidade_id: 256,
    procedimento_id: 1,
    data: date,
    horario: time,
    valor: 0,
    plano: 0,
    canal_id: 10,
    celular: patientPhone,
    telefone: patientPhone,
    email: patientEmail,
    notas: 'Agendamento criado via integração LeadConnector + Feegow'
  });

  return response.data;
};

module.exports = {
  parseSlotId,
  createAppointment
};