import { hashPassword } from "$lib/password";
import { prisma } from "$lib/db";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

// Create invitation for student
export async function POST({ locals, request }) {
	if (!locals.session) {
		return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
			status: 401
		});
	}

	if (!locals.user?.isAdmin) {
		return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), { status: 403 });
	}

	const { email, memberId } = await request.json();

	// Check if email or memberId already exists
	const existingUser = await prisma.user.findFirst({
		where: {
			OR: [
				{ email },
				{ memberId }
			]
		}
	});

	if (existingUser) {
		return new Response(JSON.stringify({ 
			success: false, 
			message: 'A user with this email or member ID already exists' 
		}), {
			status: 400
		});
	}

	// Check if invitation already exists
	const existingInvitation = await prisma.invitation.findFirst({
		where: {
			OR: [
				{ email },
				{ memberId }
			],
			used: false
		}
	});

	if (existingInvitation) {
		return new Response(JSON.stringify({ 
			success: false, 
			message: 'An active invitation for this email or member ID already exists' 
		}), {
			status: 400
		});
	}

	// Generate invitation token
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);

	// Create invitation (expires in 7 days)
	const invitation = await prisma.invitation.create({
		data: {
			email,
			memberId,
			token,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
		}
	});

	if (!invitation) {
		return new Response(JSON.stringify({ success: false, message: 'Failed to create invitation' }), {
			status: 500
		});
	}

	// TODO: Send email with invitation link
	// The invitation link would be: /register?token=${token}

	return new Response(JSON.stringify({ 
		success: true, 
		message: 'Invitation created successfully',
		token // Return token for now (for testing, remove in production)
	}));
}

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

export async function DELETE({ locals, request }) {
	if (!locals.session) {
		return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
			status: 401
		});
	}

	if (!locals.user?.isAdmin) {
		return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), { status: 403 });
	}

	const { id } = await request.json();

	await prisma.user.delete({
		where: {
			id: id
		}
	});

	return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
		status: 200
	});
}
