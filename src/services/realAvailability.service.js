const {
  getAvailableSchedule,
  flattenAvailableSchedule
} = require('./feegowAvailability.service');

const PROFESSIONAL_IDS = [2, 4];
const PROCEDIMENTO_ID = 1;
const UNIDADE_ID = 0;

const SHIFT_MANHA = 'manha';
const SHIFT_TARDE = 'tarde';

const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado'
];

const SHIFT_LABELS = {
  manha: 'manhã',
  tarde: 'tarde'
};

const normalizeShift = (value) => {
  if (!value) return '';
  const v = value.toLowerCase().trim();

  if (v === 'manhã') return SHIFT_MANHA;
  return v;
};

const normalizeWeekday = (value) => {
  if (!value) return '';
  return value.toLowerCase().trim();
};

const formatDate = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const getShift = (time) => {
  const hour = Number(time.split(':')[0]);
  return hour < 12 ? SHIFT_MANHA : SHIFT_TARDE;
};

const formatLabel = (time) => {
  const [h, m] = time.split(':');
  return `${h}h${m === '00' ? '' : m}`;
};

const createOption = (slot) => ({
  slotId: `${slot.date}T${slot.time}|${slot.professionalId}|${slot.localId}`,
  label: `${slot.weekday} às ${formatLabel(slot.time)}`,
  timeLabel: formatLabel(slot.time),
  weekday: slot.weekday,
  date: slot.date
});

const enrich = (slot) => {
  const d = new Date(`${slot.date}T${slot.time}`);
  return {
    ...slot,
    weekday: WEEKDAYS[d.getDay()],
    shift: getShift(slot.time),
    datetime: `${slot.date}T${slot.time}`
  };
};

const fetchSlotsFromProfessional = async (professionalId, start, end) => {
  const res = await getAvailableSchedule({
    procedimentoId: PROCEDIMENTO_ID,
    dataStart: start,
    dataEnd: end,
    unidadeId: UNIDADE_ID,
    profissionalId: professionalId
  });

  return flattenAvailableSchedule(res).map(enrich);
};

const fetchAllSlots = async () => {
  const start = '09-04-2026';
  const end = '30-04-2026';

  const allResults = [];
  const debugByProfessional = [];

  for (const professionalId of PROFESSIONAL_IDS) {
    const raw = await getAvailableSchedule({
      procedimentoId: PROCEDIMENTO_ID,
      dataStart: start,
      dataEnd: end,
      unidadeId: UNIDADE_ID,
      profissionalId
    });

    const flattened = flattenAvailableSchedule(raw).map(enrich);

    debugByProfessional.push({
      professionalId,
      totalFromApi: raw?.total ?? null,
      rawSuccess: raw?.success ?? null,
      hasContent: !!raw?.content,
      flattenedCount: flattened.length,
      rawContentPreview: JSON.stringify(raw?.content).slice(0, 500)
    });

    allResults.push(...flattened);
  }

  return {
    slots: allResults.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
    debugByProfessional
  };
};

const getNextOccurrenceDateForWeekday = (weekdayName) => {
  const targetIndex = WEEKDAYS.indexOf(weekdayName);

  if (targetIndex === -1) {
    return null;
  }

  const today = new Date();
  const todayIndex = today.getDay();

  let diff = targetIndex - todayIndex;

  if (diff < 0) {
    diff += 7;
  }

  const targetDate = new Date(today);
  targetDate.setHours(0, 0, 0, 0);
  targetDate.setDate(today.getDate() + diff);

  return targetDate.toISOString().slice(0, 10);
};

const getFirstAvailableDateAfter = (slots, minDate, minDateTime = null) => {
  for (const slot of slots) {
    const slotDate = slot.date;
    const slotDateTime = new Date(slot.datetime).getTime();

    if (minDateTime !== null) {
      if (slotDateTime > minDateTime) {
        return slotDate;
      }
      continue;
    }

    if (slotDate > minDate) {
      return slotDate;
    }
  }

  return null;
};

const buildTwoOptionsOfferText = ({ patientName, preferredWeekday, preferredShift, options }) => {
  const first = options[0];
  const second = options[1];

  if (!first || !second) {
    return `${patientName}, não encontrei dois horários compatíveis agora. Posso verificar a próxima disponibilidade mais próxima para você?`;
  }

  const shiftLabel = SHIFT_LABELS[preferredShift] || preferredShift;

  return `${patientName}, para ${preferredWeekday} no período da ${shiftLabel}, tenho estas duas opções mais próximas: 1) ${first.timeLabel}  2) ${second.timeLabel}. Qual você prefere?`;
};

const buildSplitFourOfferText = ({ patientName, dateLabel, morning, afternoon }) => {
  const morningText = morning.length
    ? `De manhã: 1) ${morning[0]?.timeLabel || '-'}  2) ${morning[1]?.timeLabel || '-'}`
    : 'De manhã: sem opções no momento';

  const afternoonText = afternoon.length
    ? `De tarde: 3) ${afternoon[0]?.timeLabel || '-'}  4) ${afternoon[1]?.timeLabel || '-'}`
    : 'De tarde: sem opções no momento';

  return `${patientName}, consegui encontrar a próxima disponibilidade mais próxima para ${dateLabel}. ${morningText}. ${afternoonText}. Qual opção você prefere?`;
};

const getRealAvailability = async ({
  patientName,
  preferredWeekday,
  preferredShift,
  attempt,
  lastOfferedAfter
}) => {
  const weekday = normalizeWeekday(preferredWeekday);
  const shift = normalizeShift(preferredShift);
  const safeAttempt = Number(attempt) || 1;

  if (safeAttempt > 3) {
    return {
      success: true,
      attempt: safeAttempt,
      handover: true,
      message: 'Encaminhar para atendente humano'
    };
  }

  const slots = await fetchAllSlots();

  if (!slots.length) {
    return {
      success: false,
      attempt: safeAttempt,
      handover: true,
      message: 'Nenhum slot foi encontrado na agenda real.',
      debug: {
        totalSlots: 0
      }
    };
  }

  const targetDate = getNextOccurrenceDateForWeekday(weekday);

  if (safeAttempt === 1) {
    const exactMatches = slots.filter(
      (s) => s.date === targetDate && s.shift === shift
    );

    const options = exactMatches.slice(0, 2).map(createOption);

    return {
      success: true,
      attempt: safeAttempt,
      handover: false,
      offerMode: 'two_options',
      offerText: buildTwoOptionsOfferText({
        patientName,
        preferredWeekday,
        preferredShift: shift,
        options
      }),
      option1: options[0] || null,
      option2: options[1] || null,
      options,
      debug: {
        totalSlots: slots.length,
        targetDate,
        exactMatches: exactMatches.length
      }
    };
  }

  let nextAvailableDate = null;

  if (lastOfferedAfter) {
    const cutoffDateTime = new Date(lastOfferedAfter).getTime();
    nextAvailableDate = getFirstAvailableDateAfter(slots, null, cutoffDateTime);
  } else {
    nextAvailableDate = getFirstAvailableDateAfter(slots, targetDate, null);
  }

  if (!nextAvailableDate) {
    return {
      success: true,
      attempt: safeAttempt,
      handover: true,
      message: 'Encaminhar para atendente humano',
      debug: {
        totalSlots: slots.length,
        targetDate,
        nextAvailableDate: null
      }
    };
  }

  const nextDateSlots = slots.filter((s) => s.date === nextAvailableDate);

  const morning = nextDateSlots
    .filter((s) => s.shift === SHIFT_MANHA)
    .slice(0, 2)
    .map(createOption);

  const afternoon = nextDateSlots
    .filter((s) => s.shift === SHIFT_TARDE)
    .slice(0, 2)
    .map(createOption);

  if (morning.length === 0 && afternoon.length === 0) {
    return {
      success: true,
      attempt: safeAttempt,
      handover: true,
      message: 'Encaminhar para atendente humano',
      debug: {
        totalSlots: slots.length,
        targetDate,
        nextAvailableDate,
        nextDateSlots: nextDateSlots.length
      }
    };
  }

  const dateLabel = morning[0]?.weekday || afternoon[0]?.weekday || nextAvailableDate;

  return {
    success: true,
    attempt: safeAttempt,
    handover: false,
    offerMode: 'split_four',
    offerText: buildSplitFourOfferText({
      patientName,
      dateLabel,
      morning,
      afternoon
    }),
    option1: morning[0] || null,
    option2: morning[1] || null,
    option3: afternoon[0] || null,
    option4: afternoon[1] || null,
    options: {
      morning,
      afternoon
    },
    debug: {
      totalSlots: slots.length,
      targetDate,
      nextAvailableDate,
      nextDateSlots: nextDateSlots.length
    }
  };
};

module.exports = {
  getRealAvailability,
  normalizeShift
};
