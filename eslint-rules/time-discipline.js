/**
 * time/no-ambient-date: every date the UI parses or formats goes through src/shared/time.
 *
 * A separate rule, not more no-restricted-syntax selectors: eslint.config.js switches
 * no-restricted-syntax off wholesale for several files (the fetch exemptions, src/shared/money/**),
 * and date bans placed there would be silently disabled in exactly those files, two of which format
 * dates. RandomDocuments/TimezoneCorrectness_2026-09-25.
 */
const SHARED_TIME = 'Use @/shared/time';

const BANNED = {
  'NewExpression[callee.name="Date"][arguments.length>0]':
    `${SHARED_TIME} (parseInstant / tryParseInstant): new Date(value) reads a zone-less timestamp as the viewer's local time, and "YYYY-MM-DD" as UTC midnight.`,
  'CallExpression[callee.property.name=/^toLocale(Date|Time)String$/]':
    `${SHARED_TIME} (formatDate / formatTime / formatLocalDate), which render in a named zone.`,
  'CallExpression[callee.property.name="toLocaleString"][callee.object.type="NewExpression"][callee.object.callee.name="Date"]':
    `${SHARED_TIME} (formatDateTime), which renders in a named zone.`,
  'CallExpression[callee.property.name=/^(split|slice|substring)$/][callee.object.type="CallExpression"][callee.object.callee.property.name="toISOString"]':
    `toISOString() is UTC, so slicing it gives the UTC date, not today. ${SHARED_TIME} (todayIn / localDateOf).`,
  'ImportDeclaration[source.value=/^date-fns/]':
    `date-fns formats in the ambient zone. ${SHARED_TIME}.`,
  'MemberExpression[object.name="Intl"][property.name="DateTimeFormat"]':
    `Zone handling lives in @/shared/time; format through it.`,
  'CallExpression[callee.property.name=/^(getHours|getMinutes|getDate|getDay|getMonth|getFullYear|setHours|setMinutes|setDate|setMonth|setFullYear)$/]':
    `Local calendar accessors read the ambient zone. ${SHARED_TIME} (localDateOf / addDays / dayWindow).`,
};

const noAmbientDate = {
  meta: {
    type: 'problem',
    docs: { description: 'Parse and format dates only through src/shared/time' },
    schema: [],
  },
  create(context) {
    const visitors = {};
    for (const [selector, message] of Object.entries(BANNED)) {
      visitors[selector] = (node) => context.report({ node, message });
    }
    return visitors;
  },
};

export default { rules: { 'no-ambient-date': noAmbientDate } };
