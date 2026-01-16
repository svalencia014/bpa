import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/auth";
import { verifyPasswordHash } from "$lib/password";
import { prisma } from "$lib/db";

export async function POST(event) {
  const { username, password } = await event.request.json();

  const passwordHash = (
    await prisma.user.findUnique({
      where: {
        id: username
      },
      select: {
        password: true
      }
    })
  )?.password;

  if (passwordHash === null || passwordHash === undefined) {
    return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
  }

  if ( await verifyPasswordHash(passwordHash, password)) {
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, username);
    setSessionTokenCookie(event, sessionToken, session.expiresAt);
    return new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 });
  } else {
    return new Response(JSON.stringify({ message: "Invalid Password" }), { status: 401 });
  }
}