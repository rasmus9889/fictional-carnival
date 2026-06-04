import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function requireBasicAuth(request: NextRequest): NextResponse | null {
  const stagingPass = process.env.STAGING_PASS;
  if (!stagingPass) return null;

  const stagingUser = process.env.STAGING_USER ?? 'admin';
  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');
    if (user === stagingUser && pass === stagingPass) return null;
  }
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Staging"' },
  });
}

export default auth((req) => {
  if (process.env.TEST_MODE === 'true') {
    const deny = requireBasicAuth(req);
    if (deny) return deny;
  }

  if (req.nextUrl.pathname.startsWith('/dashboard') && !req.auth) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
