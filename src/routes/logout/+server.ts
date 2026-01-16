import { deleteSessionTokenCookie, invalidateSession } from "$lib/auth";
import type { RequestEvent } from "./$types";

export async function GET(event: RequestEvent): Promise<Response> {
  await invalidateSession(event.locals.session!.id);
  deleteSessionTokenCookie(event);
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/'
    }
  })
}