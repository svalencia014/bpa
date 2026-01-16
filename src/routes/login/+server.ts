import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/auth";
import { verifyPasswordHash } from "$lib/password";
import { prisma } from "$lib/db";

export async function POST(event) {
  const { email, password } = await event.request.json();

  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      password: true,
      id: true
    }
  })

  if (user?.password === null || user?.password === undefined) {
    return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
  }

  if ( await verifyPasswordHash(user.password, password)) {
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    setSessionTokenCookie(event, sessionToken, session.expiresAt);
    return new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 });
  } else {
    return new Response(JSON.stringify({ message: "Invalid Password" }), { status: 401 });
  }
}