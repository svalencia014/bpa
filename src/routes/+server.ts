import { prisma } from '$lib/db';

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
	const title = String(body?.title ?? '').trim();
	const message = String(body?.message ?? '').trim();

	if (!title || !message) {
		return json({ error: 'Title and message are required.' }, 400);
	}

	try {
		const announcement = await prisma.announcement.create({
			data: {
				title,
				message,
				authorId: locals.user!.id
			},
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

		return json({ success: true, announcement }, 201);
	} catch (error) {
		console.error('Error creating announcement:', error);
		return json({ error: 'Internal Server Error' }, 500);
	}
}

export async function DELETE({ locals, request }) {
	const authError = requireAdmin(locals);
	if (authError) {
		return authError;
	}

	const body = await request.json();
	const announcementId = String(body?.announcementId ?? '').trim();

	if (!announcementId) {
		return json({ error: 'Missing announcement ID.' }, 400);
	}

	try {
		await prisma.announcement.delete({
			where: {
				id: announcementId
			}
		});

		return json({ success: true, announcementId });
	} catch (error) {
		console.error('Error deleting announcement:', error);
		return json({ error: 'Internal Server Error' }, 500);
	}
}
