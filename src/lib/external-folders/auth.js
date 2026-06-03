// Shared-password gate for External Project Folders (V1).
//
// We never compare the password on the client. The browser POSTs the entered
// password to /api/external-folders/auth, the server compares against
// EXTERNAL_FOLDER_PASSWORD, and on success sets an httpOnly cookie. All
// folder API routes verify the cookie. A separate /api/external-folders/auth
// GET endpoint reports whether the cookie is present so the client can render
// the gate or the content.

import { cookies } from 'next/headers';
import crypto from 'node:crypto';

const COOKIE_NAME = 'sf_ext_folders';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours per session.

function secret() {
  // Reuse the password as the signing secret in V1. The cookie value is just a
  // signed timestamp, so we don't need a separate secret to be configured.
  return process.env.EXTERNAL_FOLDER_PASSWORD || '1234';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function buildToken() {
  const ts = String(Date.now());
  return `${ts}.${sign(ts)}`;
}

function verifyToken(token) {
  if (!token) return false;
  const [ts, sig] = String(token).split('.');
  if (!ts || !sig) return false;
  const ageMs = Date.now() - Number(ts);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > COOKIE_MAX_AGE * 1000) return false;
  const expected = sign(ts);
  return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
}

export function expectedPassword() {
  return process.env.EXTERNAL_FOLDER_PASSWORD || '1234';
}

export function checkPassword(input) {
  if (typeof input !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expectedPassword());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function setAccessCookie() {
  cookies().set(COOKIE_NAME, buildToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAccessCookie() {
  cookies().delete(COOKIE_NAME);
}

export function hasAccess() {
  const c = cookies().get(COOKIE_NAME)?.value;
  return verifyToken(c);
}

/** Throws a Response(401) if the caller is not authenticated. */
export function requireAccess() {
  if (!hasAccess()) {
    throw new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
