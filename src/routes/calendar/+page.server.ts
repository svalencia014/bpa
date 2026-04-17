import { prisma } from '$lib/db.js';

export async function load() {
    const events = await prisma.event.findMany({
        orderBy: { dateStart: 'asc' },
    });

    return {
        events
    };
}
