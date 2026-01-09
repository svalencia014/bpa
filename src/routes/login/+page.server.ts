import { redirect } from "@sveltejs/kit";
import type { PageServerLoad, RequestEvent } from "./$types";

export const load: PageServerLoad = async (event: RequestEvent) => {
  if (event.locals.session != null) {
    return redirect(302, "/");
  }
}