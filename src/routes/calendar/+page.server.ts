import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/db.js';

export async function load({ locals }) {

	const attendanceSelection = {
		select: {
			userId: true,
			status: true,
			recordedAt: true,
			updatedAt: true,
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					memberId: true
				}
			}
		},
		orderBy: {
			user: {
				name: 'asc' as const
			}
		}
	};

	const events = await prisma.event.findMany({
		orderBy: [{ dateStart: 'asc' }, { name: 'asc' }],
		include: {
			attendances: locals.user.isAdmin
				? attendanceSelection
				: {
						...attendanceSelection,
						where: {
							userId: locals.user.id
						}
					}
		}
	});

	const members = locals.user.isAdmin
		? await prisma.user.findMany({
				where: {
					memberId: {
						not: null
					}
				},
				select: {
					id: true,
					name: true,
					email: true,
					memberId: true
				},
				orderBy: {
					name: 'asc'
				}
			})
		: [];

	return {
		events,
		members,
		user: {
			id: locals.user.id,
			isAdmin: locals.user.isAdmin
		}
	};
}
