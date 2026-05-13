import { prisma } from '$lib/db.js';
import { AttendanceStatus, EventType } from '../../../generated/prisma/enums.js';

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

function requireAdmin(locals: App.Locals) {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, 401);
	}

	if (!locals.user?.isAdmin) {
		return json({ error: 'Forbidden' }, 403);
	}

	return null;
}

export async function POST({ locals, request }) {
	const authError = requireAdmin(locals);
	if (authError) {
		return authError;
	}

	const body = await request.json();
	const name = String(body?.name ?? '').trim();
	const dateStart = new Date(body?.dateStart);
	const dateEnd = new Date(body?.dateEnd);
	const location = body?.location ? String(body.location).trim() : undefined;
	const mandatory = Boolean(body?.mandatory);
	const eventTypeInput = String(body?.eventType ?? 'OTHER').toUpperCase();

	if (!(eventTypeInput in EventType)) {
		return json({ error: 'Invalid event type.' }, 400);
	}

	if (!name || Number.isNaN(dateStart.getTime()) || Number.isNaN(dateEnd.getTime())) {
		return json({ error: 'Missing or invalid event data.' }, 400);
	}

	if (dateEnd < dateStart) {
		return json({ error: 'Event end time must be after start time.' }, 400);
	}

	try {
		const createdEvent = await prisma.event.create({
			data: {
				name,
				dateStart,
				dateEnd,
				location,
				mandatory,
				eventType: EventType[eventTypeInput as keyof typeof EventType]
			},
			include: {
				attendances: {
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
					}
				}
			}
		});

		return json(createdEvent, 201);
	} catch (error) {
		console.error('Error creating event:', error);
		return json({ error: 'Internal Server Error' }, 500);
	}
}

export async function PUT({ locals, request }) {
	const authError = requireAdmin(locals);
	if (authError) {
		return authError;
	}

	const body = await request.json();
	const eventId = String(body?.eventId ?? '').trim();
	const userId = String(body?.userId ?? '').trim();
	const statusInput = String(body?.status ?? '').toUpperCase();

	if (!eventId || !userId || !(statusInput in AttendanceStatus)) {
		return json({ error: 'Missing or invalid attendance data.' }, 400);
	}

	const event = await prisma.event.findUnique({
		where: { id: eventId },
		select: {
			id: true,
			mandatory: true,
			eventType: true
		}
	});

	if (!event) {
		return json({ error: 'Event not found.' }, 404);
	}

	if (
		!event.mandatory ||
		(event.eventType !== EventType.MEETING && event.eventType !== EventType.PRACTICE)
	) {
		return json(
			{ error: 'Attendance can only be tracked for mandatory meetings and practices.' },
			400
		);
	}

	const member = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true }
	});

	if (!member) {
		return json({ error: 'Member not found.' }, 404);
	}

	try {
		const attendance = await prisma.attendance.upsert({
			where: {
				eventId_userId: {
					eventId,
					userId
				}
			},
			create: {
				eventId,
				userId,
				status: AttendanceStatus[statusInput as keyof typeof AttendanceStatus]
			},
			update: {
				status: AttendanceStatus[statusInput as keyof typeof AttendanceStatus]
			},
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
			}
		});

		return json({ success: true, attendance });
	} catch (error) {
		console.error('Error recording attendance:', error);
		return json({ error: 'Internal Server Error' }, 500);
	}
}

export async function DELETE({ locals, request }) {
	const authError = requireAdmin(locals);
	if (authError) {
		return authError;
	}

	const body = await request.json();
	const eventId = String(body?.eventId ?? '').trim();

	if (!eventId) {
		return json({ error: 'Missing event ID.' }, 400);
	}

	const existingEvent = await prisma.event.findUnique({
		where: { id: eventId },
		select: { id: true }
	});

	if (!existingEvent) {
		return json({ error: 'Event not found.' }, 404);
	}

	try {
		await prisma.event.delete({
			where: { id: eventId }
		});

		return json({ success: true, eventId });
	} catch (error) {
		console.error('Error deleting event:', error);
		return json({ error: 'Internal Server Error' }, 500);
	}
}
