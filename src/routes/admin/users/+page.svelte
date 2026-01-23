<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let email = $state('');
	let memberId = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	const formatDate = (value: string | Date) => {
		return new Date(value).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	const submitInvitation = async (event: Event) => {
		event.preventDefault();
		loading = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/admin/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, memberId })
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.message ?? 'Failed to create invitation');
			}

			success = 'Invitation created. They will receive an email to finish setup.';
			email = '';
			memberId = '';
			await invalidateAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>User Management</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<div>
			<p class="eyebrow">Admin</p>
			<h1>User Management</h1>
			<p class="lede">Invite students with their BPA member ID and email. Existing users are listed below.</p>
		</div>
	</header>

	<section class="grid">
		<div class="card">
			<div class="card-header">
				<div>
					<p class="eyebrow">Invitations</p>
					<h2>Invite a student</h2>
					<p class="hint">Students are invited; accounts are created when they accept.</p>
				</div>
			</div>
			<div class="card-body">
				<form class="form" onsubmit={submitInvitation}>
					<label>
						<span>Email</span>
						<input
							type="email"
							name="email"
							bind:value={email}
							required
							placeholder="student@example.com"
						/>
					</label>

					<label>
						<span>BPA Member ID</span>
						<input
							type="text"
							name="memberId"
							bind:value={memberId}
							required
							placeholder="e.g. 123456"
						/>
					</label>

					<div class="actions">
						<button type="submit" class="primary" disabled={loading}>
							{#if loading}Sending…{/if}
							{#if !loading}Send invite{/if}
						</button>
					</div>

					{#if error}
						<p class="error">{error}</p>
					{/if}
					{#if success}
						<p class="success">{success}</p>
					{/if}
				</form>
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<div>
					<p class="eyebrow">Pending</p>
					<h2>Active invitations</h2>
					<p class="hint">Unexpired, unused invites.</p>
				</div>
			</div>
			<div class="card-body">
				{#if data.invitations.length === 0}
					<p class="muted">No active invitations.</p>
				{:else}
					<div class="table invites">
						<div class="table-head">
							<span>Email</span>
							<span>Member ID</span>
							<span>Expires</span>
						</div>
						{#each data.invitations as invite}
							<div class="table-row">
								<span>{invite.email}</span>
								<span>{invite.memberId}</span>
								<span>{formatDate(invite.expiresAt)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="card full">
		<div class="card-header">
			<div>
				<p class="eyebrow">Directory</p>
				<h2>Existing users</h2>
				<p class="hint">Admins are marked; students are invited, not directly created.</p>
			</div>
		</div>
		<div class="card-body">
			{#if data.users.length === 0}
				<p class="muted">No users yet.</p>
			{:else}
				<div class="table">
					<div class="table-head">
						<span>Name</span>
						<span>Email</span>
						<span>Member ID</span>
						<span>Role</span>
						<span>Joined</span>
					</div>
					{#each data.users as user}
						<div class="table-row">
							<span>{user.name}</span>
							<span>{user.email}</span>
							<span>{user.memberId ?? '—'}</span>
							<span class:admin={user.isAdmin} class="pill">{user.isAdmin ? 'Admin' : 'User'}</span>
							<span>{formatDate(user.createdAt)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #0f172a;
		color: #0b1221;
	}

	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1.5rem 3rem;
	}

	.page-header h1 {
		margin: 0.25rem 0 0.4rem;
		color: #e2e8f0;
	}

	.page-header .lede {
		margin: 0;
		color: #94a3b8;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: #94a3b8;
		margin: 0;
	}

	.hint {
		margin: 0.25rem 0 0;
		color: #94a3b8;
		font-size: 0.9rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.card {
		background: #0b1221;
		border: 1px solid #1f2937;
		border-radius: 14px;
		box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	.card.full {
		margin-top: 1rem;
	}

	.card-header {
		padding: 1.25rem 1.5rem 0.75rem;
		border-bottom: 1px solid #1f2937;
	}

	.card-header h2 {
		margin: 0.15rem 0 0.25rem;
		color: #e2e8f0;
	}

	.card-body {
		padding: 1.25rem 1.5rem 1.5rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		color: #e2e8f0;
		font-weight: 600;
	}

	input {
		padding: 0.75rem 0.85rem;
		border-radius: 10px;
		border: 1px solid #273449;
		background: #111827;
		color: #e2e8f0;
		font-size: 1rem;
	}

	input:focus {
		outline: 2px solid #60a5fa;
		border-color: #60a5fa;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
	}

	button {
		border: none;
		border-radius: 10px;
		padding: 0.75rem 1.25rem;
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	button.primary {
		background: linear-gradient(135deg, #60a5fa, #7c3aed);
		color: #0b1221;
		box-shadow: 0 10px 30px rgba(124, 58, 237, 0.3);
	}

	button.primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 14px 32px rgba(124, 58, 237, 0.35);
	}

	.error {
		color: #f87171;
		margin: 0.25rem 0 0;
	}

	.success {
		color: #34d399;
		margin: 0.25rem 0 0;
	}

	.muted {
		color: #94a3b8;
		margin: 0;
	}

	.table {
		display: grid;
		gap: 0.5rem;
	}

	.table.invites .table-head,
	.table.invites .table-row {
		grid-template-columns: 1.5fr 1fr 1fr;
	}

	.table-head,
	.table-row {
		display: grid;
		grid-template-columns: 1.5fr 1fr 0.8fr 0.8fr 0.8fr;
		gap: 0.75rem;
		align-items: center;
	}

	.table-head {
		color: #94a3b8;
		font-size: 0.9rem;
		border-bottom: 1px solid #1f2937;
		padding-bottom: 0.35rem;
	}

	.table-row {
		padding: 0.5rem 0;
		color: #e2e8f0;
		border-bottom: 1px solid #0f172a;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.table-row span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.table .table-row:nth-child(odd) {
		background: rgba(255, 255, 255, 0.02);
		padding: 0.5rem;
		border-radius: 10px;
	}

	.pill {
		display: inline-block;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		background: #111827;
		text-align: center;
		min-width: 60px;
	}

	.pill.admin {
		background: linear-gradient(135deg, #fb7185, #f97316);
		color: #0b1221;
		font-weight: 700;
	}

	@media (max-width: 900px) {
		.table-head,
		.table-row {
			grid-template-columns: repeat(3, 1fr);
			grid-auto-rows: auto;
			row-gap: 0.35rem;
		}

		.table-head span:nth-child(n+4),
		.table-row span:nth-child(n+4) {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.grid {
			grid-template-columns: 1fr;
		}

		.page {
			padding: 1.5rem 1rem 2.5rem;
		}

		.table-head,
		.table-row {
			grid-template-columns: 1fr;
		}

		.table-head span:nth-child(n+2),
		.table-row span:nth-child(n+2) {
			display: block;
		}
	}
</style>
