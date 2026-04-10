import { prisma } from '$lib/db.js';
import type { Event } from '../../../generated/prisma/client.js';

export async function POST({ locals, request }) {
    if (!locals.session) {
        return new Response('Unauthorized', { status: 401 });
    }

    const newEvent: Event= await request.json();

    try {
        const createdEvent = await prisma.event.create({
            data: newEvent,
        });
        return new Response(JSON.stringify(createdEvent), { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}