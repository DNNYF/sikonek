import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseServer } from '@/lib/supabase-server'
import { getSessionCookieName, getSessionMaxAge, signAdminSession } from '@/lib/auth-session'

export async function POST(request) {
  try {
    const body = await request.json()
    const username = body?.username?.trim()
    const password = body?.password

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    const { data: admin, error } = await supabaseServer
      .from('admins')
      .select('id, username, password, full_name, role')
      .eq('username', username)
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    await supabaseServer.from('admins').update({ last_login: new Date().toISOString() }).eq('id', admin.id)

    const token = await signAdminSession({
      sub: admin.id,
      username: admin.username,
      full_name: admin.full_name,
      role: admin.role || 'staff',
    })

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        role: admin.role || 'staff',
      },
    })

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: getSessionMaxAge(),
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}