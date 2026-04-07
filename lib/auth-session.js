import { SignJWT, jwtVerify } from 'jose'

const encoder = new TextEncoder()
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

if (!secret) {
  throw new Error('Missing environment variable: AUTH_SECRET (or NEXTAUTH_SECRET)')
}

const secretKey = encoder.encode(secret)

const SESSION_NAME = 'admin_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 8

export function getSessionCookieName() {
  return SESSION_NAME
}

export function getSessionMaxAge() {
  return SESSION_DURATION_SECONDS
}

export async function signAdminSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey)
}

export async function verifyAdminSession(token) {
  const { payload } = await jwtVerify(token, secretKey)
  return payload
}