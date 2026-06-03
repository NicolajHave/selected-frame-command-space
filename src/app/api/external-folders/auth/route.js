import { NextResponse } from 'next/server';
import { checkPassword, setAccessCookie, clearAccessCookie, hasAccess } from '../../../../lib/external-folders/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ access: hasAccess() });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const password = body?.password;
  if (!checkPassword(password)) {
    // 1 second delay to slow down brute force attempts.
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  setAccessCookie();
  return NextResponse.json({ access: true });
}

export async function DELETE() {
  clearAccessCookie();
  return NextResponse.json({ access: false });
}
