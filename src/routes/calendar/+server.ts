import { prisma } from '$lib/db.js';

export async function POST({ locals, request }) {
    if (!locals.session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const dateStart = new Date(body?.dateStart);
    const dateEnd = new Date(body?.dateEnd);
    const location = body?.location ? String(body.location).trim() : undefined;

    if (!name || Number.isNaN(dateStart.getTime()) || Number.isNaN(dateEnd.getTime())) {
        return new Response(JSON.stringify({ error: 'Missing or invalid event data.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const createdEvent = await prisma.event.create({
            data: {
                name,
                dateStart,
                dateEnd,
                location,
            },
        });
        return new Response(JSON.stringify(createdEvent), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating event:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}