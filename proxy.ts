import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Proxy temporarily disabled to debug authentication issues
// Using client-side AuthGuard instead

export default function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

