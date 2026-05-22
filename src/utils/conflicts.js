/**
 * Detect scheduling conflicts.
 * Each entry has: { id, name, team, activities: [{location, date, startTime, endTime}] }
 * Two activity slots conflict if same location (case-insensitive) + same date + overlapping time.
 */
export function detectConflicts(entries) {
  const conflicts = [];

  // Build a flat list of {entryId, name, team, activity}
  const slots = [];
  for (const entry of entries) {
    for (const act of entry.activities || []) {
      slots.push({ entryId: entry.id, name: entry.name, team: entry.team, ...act });
    }
  }

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];

      // Skip same person's own activities (optional — keep to detect self-conflicts too? No, skip)
      if (a.entryId === b.entryId) continue;

      if (a.date !== b.date) continue;

      const locA = (a.location || '').trim().toLowerCase();
      const locB = (b.location || '').trim().toLowerCase();
      if (!locA || !locB || locA !== locB) continue;

      const aStart = toMin(a.startTime), aEnd = toMin(a.endTime);
      const bStart = toMin(b.startTime), bEnd = toMin(b.endTime);

      if (aStart < bEnd && bStart < aEnd) {
        conflicts.push({ a, b });
      }
    }
  }

  return conflicts;
}

function toMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatTime(t) {
  if (!t) return '--';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatDate(d) {
  if (!d) return '--';
  const [y, mo, day] = d.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[mo - 1]} ${day}, ${y}`;
}
