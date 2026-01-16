import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name,
			memberId: locals.user.memberId,
			isAdmin: locals.user.isAdmin,
			createdAt: locals.user.createdAt
		}
	};
};
