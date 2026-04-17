const feegowClient = require('./feegowClient.service');

const getAvailableSchedule = async ({
  procedimentoId,
  dataStart,
  dataEnd,
  unidadeId,
  profissionalId
}) => {
  const response = await feegowClient.get('/appoints/available-schedule', {
    params: {
      tipo: 'P',
      procedimento_id: procedimentoId,
      data_start: dataStart,
      data_end: dataEnd,
      unidade_id: unidadeId,
      profissional_id: profissionalId
    }
  });

  return response.data;
};

const flattenAvailableSchedule = (feegowResponse) => {
  const content = feegowResponse?.content;

  if (!content || !content.profissional_id) {
    return [];
  }

  const resultado = [];
  const profissionais = content.profissional_id;

  for (const professionalId in profissionais) {
    const locais = profissionais[professionalId].local_id || {};

    for (const localId in locais) {
      const datas = locais[localId];

      for (const date in datas) {
        const horarios = datas[date];

        for (const time of horarios) {
          resultado.push({
            professionalId: Number(professionalId),
            localId: Number(localId),
            date,
            time,
            datetime: `${date}T${time}`
          });
        }
      }
    }
  }

  return resultado.sort((a, b) => {
    return new Date(a.datetime) - new Date(b.datetime);
  });
};

module.exports = {
  getAvailableSchedule,
  flattenAvailableSchedule
};
