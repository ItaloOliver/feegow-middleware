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

const normalizeShift = (value) => {
  if (!value) return '';
  const v = value.toLowerCase();

  if (v === 'manhã') return SHIFT_MANHA;
  return v;
};

const normalizeWeekday = (value) => {
  if (!value) return '';
  return value.toLowerCase();
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
  slotId: `${slot.date}T${slot.time}|${slot.profissionalId}|${slot.localId}`,
  label: `${slot.weekday} às ${formatLabel(slot.time)}`
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
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + 30);

  const start = formatDate(today);
  const end = formatDate(future);

  const results = await Promise.all(
    PROFESSIONAL_IDS.map((id) =>
      fetchSlotsFromProfessional(id, start, end).catch(() => [])
    )
  );

  return results.flat().sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
};

const getRealAvailability = async ({
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

  let slots = await fetchAllSlots();

  if (lastOfferedAfter) {
    const cutoff = new Date(lastOfferedAfter);
    slots = slots.filter((s) => new Date(s.datetime) > cutoff);
  }

  const matches = slots.filter(
    (s) => s.weekday === weekday && s.shift === shift
  );

  if (safeAttempt === 1) {
    return {
      success: true,
      attempt: safeAttempt,
      handover: false,
      offerMode: 'two_options',
      options: matches.slice(0, 2).map(createOption)
    };
  }

  const morning = slots
    .filter((s) => s.shift === SHIFT_MANHA)
    .slice(0, 2)
    .map(createOption);

  const afternoon = slots
    .filter((s) => s.shift === SHIFT_TARDE)
    .slice(0, 2)
    .map(createOption);

  return {
    success: true,
    attempt: safeAttempt,
    handover: false,
    offerMode: 'split_four',
    options: {
      morning,
      afternoon
    }
  };
};

module.exports = {
  getRealAvailability,
  normalizeShift
};