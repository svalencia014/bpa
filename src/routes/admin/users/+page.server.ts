import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (!locals.user.isAdmin) {
		throw redirect(302, '/dashboard');
	}

	const users = await prisma.user.findMany({
		select: {
			id: true,
			email: true,
			name: true,
			memberId: true,
			isAdmin: true,
			createdAt: true
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	const invitations = await prisma.invitation.findMany({
		where: {
			used: false,
			expiresAt: {
				gt: new Date()
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	return {
		users,
		invitations
	};
};
