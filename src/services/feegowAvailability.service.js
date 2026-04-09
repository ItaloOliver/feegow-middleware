const feegowClient = require('./feegowClient.service');

/**
 * Busca disponibilidade no Feegow
 */
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

/**
 * Transforma resposta complicada do Feegow em lista simples
 */
const flattenAvailableSchedule = (feegowResponse) => {
  const content = feegowResponse?.content;

  // Se não vier nada, retorna vazio
  if (!content || !content.profissional_id) {
    return [];
  }

  const resultado = [];

  const profissionais = content.profissional_id;

  // Loop nos profissionais
  for (const profissionalId in profissionais) {
    const locais = profissionais[profissionalId].local_id || {};

    // Loop nos locais
    for (const localId in locais) {
      const datas = locais[localId];

      // Loop nas datas
      for (const data in datas) {
        const horarios = datas[data];

        // Loop nos horários
        for (const hora of horarios) {
          resultado.push({
            profissionalId: Number(profissionalId),
            localId: Number(localId),
            date: data,
            time: hora,
            datetime: `${data}T${hora}`
          });
        }
      }
    }
  }

  // Ordena por data/hora
  return resultado.sort((a, b) => {
    return new Date(a.datetime) - new Date(b.datetime);
  });
};

module.exports = {
  getAvailableSchedule,
  flattenAvailableSchedule
};