const feegowClient = require('./feegowClient.service');

const onlyDigits = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.replace(/\D/g, '');
};

const findPatientByPhone = async (phone) => {
  const cleanPhone = onlyDigits(phone);

  if (!cleanPhone) {
    return null;
  }

  const response = await feegowClient.get('/patient/list', {
    params: {
      telefone: cleanPhone,
      limit: 10,
      offset: 0
    }
  });

  const patients = response.data?.content || [];

  if (!Array.isArray(patients) || patients.length === 0) {
    return null;
  }

  return patients[0];
};

const findPatientByCpf = async (cpf) => {
  const cleanCpf = onlyDigits(cpf);

  if (!cleanCpf) {
    return null;
  }

  try {
    const response = await feegowClient.get('/patient/search', {
      params: {
        paciente_cpf: cleanCpf,
        photo: 0
      }
    });

    return response.data?.content || null;
  } catch (error) {
    if (error.response?.status === 409) {
      return null;
    }

    throw error;
  }
};

const createPatient = async ({ name, phone, cpf, email = '' }) => {
  const cleanPhone = onlyDigits(phone);
  const cleanCpf = onlyDigits(cpf);

  const response = await feegowClient.post('/patient/create', {
    nome_completo: name,
    nome_paciente: name,
    cpf: cleanCpf,
    celular: cleanPhone,
    telefone: cleanPhone,
    email
  });

  return response.data;
};

const findOrCreatePatient = async ({ name, phone, cpf, email = '' }) => {
  const byPhone = await findPatientByPhone(phone);

  if (byPhone && byPhone.paciente_id) {
    return {
      created: false,
      patientId: byPhone.paciente_id,
      raw: byPhone
    };
  }

  const byCpf = await findPatientByCpf(cpf);

  if (byCpf && byCpf.paciente_id) {
    return {
      created: false,
      patientId: byCpf.paciente_id,
      raw: byCpf
    };
  }

  const createdPatient = await createPatient({
    name,
    phone,
    cpf,
    email
  });

  return {
    created: true,
    patientId: createdPatient?.content?.paciente_id || null,
    raw: createdPatient
  };
};

module.exports = {
  onlyDigits,
  findPatientByPhone,
  findPatientByCpf,
  createPatient,
  findOrCreatePatient
};