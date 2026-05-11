import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const now = new Date();

	const [pastMandatoryEvents, presentCount, excusedCount, absentCount] = await Promise.all([
		prisma.event.count({
			where: {
				mandatory: true,
				eventType: {
					in: ['MEETING', 'PRACTICE']
				},
				dateStart: {
					lte: now
				}
			}
		}),
		prisma.attendance.count({
			where: {
				userId: locals.user.id,
				status: 'PRESENT',
				event: {
					mandatory: true,
					eventType: {
						in: ['MEETING', 'PRACTICE']
					},
					dateStart: {
						lte: now
					}
				}
			}
		}),
		prisma.attendance.count({
			where: {
				userId: locals.user.id,
				status: 'EXCUSED',
				event: {
					mandatory: true,
					eventType: {
						in: ['MEETING', 'PRACTICE']
					},
					dateStart: {
						lte: now
					}
				}
			}
		}),
		prisma.attendance.count({
			where: {
				userId: locals.user.id,
				status: 'ABSENT',
				event: {
					mandatory: true,
					eventType: {
						in: ['MEETING', 'PRACTICE']
					},
					dateStart: {
						lte: now
					}
				}
			}
		})
	]);

	const recordedCount = presentCount + excusedCount + absentCount;

	let eligibilityLabel = 'No mandatory sessions yet';
	if (pastMandatoryEvents > 0 && absentCount > 0) {
		eligibilityLabel = 'Review needed';
	} else if (pastMandatoryEvents > 0 && recordedCount < pastMandatoryEvents) {
		eligibilityLabel = 'Attendance pending';
	} else if (pastMandatoryEvents > 0) {
		eligibilityLabel = 'Eligible';
	}

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name,
			memberId: locals.user.memberId,
			isAdmin: locals.user.isAdmin,
			createdAt: locals.user.createdAt
		},
		attendanceSummary: {
			pastMandatoryEvents,
			presentCount,
			excusedCount,
			absentCount,
			recordedCount,
			eligibilityLabel
		}
	};
};
