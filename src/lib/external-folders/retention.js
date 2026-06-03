// Retention rules for External Project Folders.
//
// The clock starts at project completion, not at folder creation. Active
// folders therefore have no deleteAt.

const DAY = 24 * 60 * 60 * 1000;

function retentionDays() {
  const n = Number(process.env.RETENTION_DAYS);
  return Number.isFinite(n) && n > 0 ? n : 750;
}

export function computeRetention({ status, completedAt }) {
  if (status !== 'completed' || !completedAt) {
    return { retentionStartDate: null, deleteAt: null };
  }
  const start = new Date(completedAt);
  const deleteAt = new Date(start.getTime() + retentionDays() * DAY);
  return {
    retentionStartDate: start.toISOString(),
    deleteAt: deleteAt.toISOString(),
  };
}

/** Days until folder.deleteAt. Returns null when retention hasn't started. */
export function daysUntilDelete(folder) {
  if (!folder?.deleteAt) return null;
  const ms = new Date(folder.deleteAt).getTime() - Date.now();
  return Math.ceil(ms / DAY);
}

export function retentionLabel(folder) {
  if (!folder) return null;
  if (folder.status === 'deleted') return 'Folder deleted according to retention policy';
  if (folder.status === 'pending_deletion') return 'Pending deletion';
  if (folder.status !== 'completed' || !folder.deleteAt) return 'Retention has not started';
  const days = daysUntilDelete(folder);
  if (days <= 0) return 'Deletes today';
  if (days === 1) return 'Deletes in 1 day';
  return `Deletes in ${days} days`;
}

export function reminderState(folder) {
  if (folder?.status !== 'completed' || !folder.deleteAt) return null;
  const days = daysUntilDelete(folder);
  const sent30 = Boolean(folder.reminder30SentAt);
  const sent7 = Boolean(folder.reminder7SentAt);
  return {
    daysLeft: days,
    reminder30Sent: sent30,
    reminder7Sent: sent7,
    reminder30Due: !sent30 && days <= 30,
    reminder7Due: !sent7 && days <= 7,
  };
}
