// Email hook for retention reminders.
//
// V1 ships a no-op stub. To wire a real provider (Resend, SendGrid, M365,
// etc.), implement the body of `sendRetentionReminder` and read provider
// credentials from env. The cron route will call this once per folder per
// reminder window and rely on the DB flag (reminder_30_sent_at /
// reminder_7_sent_at) to avoid duplicates.

export async function sendRetentionReminder({ folder, daysLeft, to }) {
  if (!to) return { sent: false, reason: 'RETENTION_REMINDER_EMAIL not set' };

  const subject = `Selected Frame — External Project Folder for "${folder.projectName}" will be deleted in ${daysLeft} days`;
  const body = `The External Project Folder for ${folder.projectName} is scheduled for deletion on ${new Date(
    folder.deleteAt,
  ).toLocaleDateString('en-GB')}.

If any files in this folder still need to be retained, please download them from the Command Space:

External Project Folders → ${folder.projectName}

After deletion, the project record itself remains in Command Space, but the uploaded files will no longer be accessible.`;

  // Intentionally not implemented: pick a provider, set credentials in env,
  // and replace this block with a real call. Keep the function signature so
  // the cron route does not change.
  // eslint-disable-next-line no-console
  console.log('[external-folders] retention reminder (stub):', { to, subject, body });
  return { sent: false, reason: 'provider_not_configured' };
}
