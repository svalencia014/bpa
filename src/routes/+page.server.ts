import { prisma } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const announcements = await prisma.announcement.findMany({
		orderBy: [{ createdAt: 'desc' }],
		take: 8,
		select: {
			id: true,
			title: true,
			message: true,
			createdAt: true,
			updatedAt: true,
			author: {
				select: {
					name: true
				}
			}
		}
	});

	return {
		announcements,
		user: locals.user
			? {
					id: locals.user.id,
					name: locals.user.name,
					isAdmin: locals.user.isAdmin
				}
			: null
	};
};
