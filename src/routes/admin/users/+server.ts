import { hashPassword } from "$lib/password";
import { prisma } from "$lib/db";

export async function PUT({ locals, request }) {
  if (!locals.session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!locals.user?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id, password, email, name, isAdmin } = await request.json();

  const passwordHash = password == null ? null : await hashPassword(password);

  if (passwordHash != null) {
    await prisma.user.update({
      where: {
        id: id
      },
      data: {
        id: id,
        password: passwordHash,
        email: email,
        name: name,
        isAdmin: isAdmin
      }
    })
  } else {
    await prisma.user.update({
      where: {
        id: id
      },
      data: {
        id: id,
        email: email,
        name: name,
        isAdmin: isAdmin
      }
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function POST({ locals, request }) {
	// if (!locals.session) {
	// 	return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
	// 		status: 401
	// 	});
	// }

	// if (!locals.user?.isAdmin) {
	// 	return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), { status: 403 });
	// }

	const { id, password, email, name, isAdmin } = await request.json();

	const passwordHash = await hashPassword(password);

	const user = await prisma.user.create({
		data: {
			id: id,
      email: email,
      name: name,
      password: passwordHash,
      isAdmin: isAdmin
		}
	});

	if (!user) {
		return new Response(JSON.stringify({ success: false, message: 'Failed to create user' }), {
			status: 500
		});
	}

	return new Response(JSON.stringify({ success: true, message: 'User created successfully' }));
}