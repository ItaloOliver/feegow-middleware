const SHIFT_MANHA = 'manha';
const SHIFT_TARDE = 'tarde';

const MOCK_SLOTS = [
  { datetime: '2026-04-13T09:30:00', weekday: 'segunda-feira', shift: SHIFT_MANHA, professionalId: 'bio_1' },
  { datetime: '2026-04-13T11:00:00', weekday: 'segunda-feira', shift: SHIFT_MANHA, professionalId: 'bio_2' },
  { datetime: '2026-04-14T09:30:00', weekday: 'terça-feira', shift: SHIFT_MANHA, professionalId: 'bio_2' },
  { datetime: '2026-04-14T10:30:00', weekday: 'terça-feira', shift: SHIFT_MANHA, professionalId: 'bio_1' },
  { datetime: '2026-04-14T14:00:00', weekday: 'terça-feira', shift: SHIFT_TARDE, professionalId: 'bio_1' },
  { datetime: '2026-04-14T17:00:00', weekday: 'terça-feira', shift: SHIFT_TARDE, professionalId: 'bio_2' },
  { datetime: '2026-04-15T09:30:00', weekday: 'quarta-feira', shift: SHIFT_MANHA, professionalId: 'bio_1' },
  { datetime: '2026-04-15T11:30:00', weekday: 'quarta-feira', shift: SHIFT_MANHA, professionalId: 'bio_2' },
  { datetime: '2026-04-15T14:30:00', weekday: 'quarta-feira', shift: SHIFT_TARDE, professionalId: 'bio_2' },
  { datetime: '2026-04-15T16:30:00', weekday: 'quarta-feira', shift: SHIFT_TARDE, professionalId: 'bio_1' }
];

const normalizeWeekday = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
};

const normalizeShift = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'manhã') {
    return SHIFT_MANHA;
  }

  if (normalized === 'tarde') {
    return SHIFT_TARDE;
  }

  return normalized;
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}h${minutes === '00' ? '' : minutes}`;
};

const createSlotId = (slot) => `${slot.datetime}|${slot.professionalId}`;

const createOption = (slot) => ({
  slotId: createSlotId(slot),
  label: `${slot.weekday} às ${formatTime(slot.datetime)}`
});

const getMockAvailability = ({ preferredWeekday, preferredShift, attempt, lastOfferedAfter }) => {
  const normalizedWeekday = normalizeWeekday(preferredWeekday);
  const normalizedShift = normalizeShift(preferredShift);
  const safeAttempt = Number.isInteger(attempt) ? attempt : 1;

  if (safeAttempt > 3) {
    return {
      success: true,
      attempt: safeAttempt,
      handover: true,
      message: 'Encaminhar para atendente humano'
    };
  }

  let availableSlots = [...MOCK_SLOTS].sort((a, b) => {
    return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
  });

  if (lastOfferedAfter) {
    const cutoff = new Date(lastOfferedAfter).getTime();
    availableSlots = availableSlots.filter((slot) => new Date(slot.datetime).getTime() > cutoff);
  }

  const firstAttemptMatches = availableSlots.filter((slot) => {
    return slot.weekday === normalizedWeekday && slot.shift === normalizedShift;
  });

  if (safeAttempt === 1) {
    const firstOptions = firstAttemptMatches.slice(0, 2).map(createOption);

    if (firstOptions.length === 0) {
      return {
        success: true,
        attempt: safeAttempt,
        handover: false,
        offerMode: 'two_options',
        options: []
      };
    }

    return {
      success: true,
      attempt: safeAttempt,
      handover: false,
      offerMode: 'two_options',
      options: firstOptions
    };
  }

  const morningOptions = availableSlots
    .filter((slot) => slot.shift === SHIFT_MANHA)
    .slice(0, 2)
    .map(createOption);

  const afternoonOptions = availableSlots
    .filter((slot) => slot.shift === SHIFT_TARDE)
    .slice(0, 2)
    .map(createOption);

  if (morningOptions.length === 0 && afternoonOptions.length === 0) {
    return {
      success: true,
      attempt: safeAttempt,
      handover: true,
      message: 'Encaminhar para atendente humano'
    };
  }

  return {
    success: true,
    attempt: safeAttempt,
    handover: false,
    offerMode: 'split_four',
    options: {
      morning: morningOptions,
      afternoon: afternoonOptions
    }
  };
};

module.exports = {
  getMockAvailability,
  normalizeShift
};