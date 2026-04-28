export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  if (!process.env.ASANA_TOKEN) {
    return Response.json({ error: 'ASANA_TOKEN not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { taskGid, text } = body || {};
  if (!taskGid || typeof taskGid !== 'string') {
    return Response.json({ error: 'taskGid is required' }, { status: 400 });
  }
  if (!text || typeof text !== 'string' || text.length < 5) {
    return Response.json({ error: 'text is required (min 5 chars)' }, { status: 400 });
  }
  if (text.length > 65000) {
    return Response.json({ error: 'text too long (max 65000 chars)' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://app.asana.com/api/1.0/tasks/${encodeURIComponent(taskGid)}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ASANA_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { text } }),
    });
    const respText = await res.text();
    let data;
    try { data = JSON.parse(respText); } catch { data = { raw: respText }; }

    if (!res.ok) {
      const apiErr = data?.errors?.[0]?.message || `HTTP ${res.status}`;
      return Response.json({
        error: res.status === 403
          ? 'Permission denied — token cannot comment on this task'
          : res.status === 404
          ? 'Task not found — it may have been deleted'
          : apiErr,
        status: res.status,
      }, { status: res.status });
    }

    return Response.json({
      success: true,
      storyGid: data?.data?.gid,
      createdAt: data?.data?.created_at,
    });
  } catch (e) {
    return Response.json({ error: e.message || 'Network error' }, { status: 500 });
  }
}
