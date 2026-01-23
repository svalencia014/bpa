<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};
</script>

<svelte:head>
	<title>Dashboard - {data.user.name}</title>
</svelte:head>

<div class="dashboard-container">
	<main class="dashboard-main">
		<div class="dashboard-grid">
			<!-- Profile Card -->
			<div class="card profile-card">
				<div class="card-header">
					<h2>Profile Information</h2>
				</div>
				<div class="card-body">
					<div class="profile-info">
						<div class="info-row">
							<span class="info-label">Name:</span>
							<span class="info-value">{data.user.name}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Email:</span>
							<span class="info-value">{data.user.email}</span>
						</div>
						{#if data.user.memberId}
							<div class="info-row">
								<span class="info-label">Member ID:</span>
								<span class="info-value">{data.user.memberId}</span>
							</div>
						{/if}
						<div class="info-row">
							<span class="info-label">Account Type:</span>
							<span class="info-value badge" class:admin={data.user.isAdmin}>
								{data.user.isAdmin ? 'Admin' : 'User'}
							</span>
						</div>
						<div class="info-row">
							<span class="info-label">Member Since:</span>
							<span class="info-value">{formatDate(data.user.createdAt)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions Card -->
			<div class="card actions-card">
				<div class="card-header">
					<h2>Quick Actions</h2>
				</div>
				<div class="card-body">
					<div class="actions-grid">
						<a href="/calendar" class="action-item">
							<div class="action-icon">📅</div>
							<div class="action-text">
								<h3>Calendar</h3>
								<p>View upcoming events</p>
							</div>
						</a>
						<a href="/" class="action-item">
							<div class="action-icon">🏠</div>
							<div class="action-text">
								<h3>Home</h3>
								<p>Back to home page</p>
							</div>
						</a>
						{#if data.user.isAdmin}
							<a href="/admin/users" class="action-item admin-action">
								<div class="action-icon">👥</div>
								<div class="action-text">
									<h3>Manage Users</h3>
									<p>Admin panel</p>
								</div>
							</a>
						{/if}
					</div>
				</div>
			</div>

			<!-- Account Stats Card -->
			<div class="card stats-card">
				<div class="card-header">
					<h2>Account Overview</h2>
				</div>
				<div class="card-body">
					<div class="stats-grid">
						<div class="stat-item">
							<div class="stat-value">{Math.floor((Date.now() - new Date(data.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}</div>
							<div class="stat-label">Days Active</div>
						</div>
						<div class="stat-item">
							<div class="stat-value">{data.user.isAdmin ? '✓' : '—'}</div>
							<div class="stat-label">Admin Access</div>
						</div>
						<div class="stat-item">
							<div class="stat-value">✓</div>
							<div class="stat-label">Active</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	.dashboard-container {
		min-height: 100vh;
		padding-bottom: 2rem;
	}

	.dashboard-header {
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: 1.5rem 2rem;
		margin-bottom: 2rem;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dashboard-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #333;
		font-weight: 600;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
	}

	.btn-logout {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.5rem 1.5rem;
		border-radius: 6px;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.btn-logout:hover {
		background: #c82333;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
	}

	.dashboard-main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.card-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.25rem 1.5rem;
	}

	.card-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.card-body {
		padding: 1.5rem;
	}

	.profile-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-weight: 600;
		color: #555;
		font-size: 0.95rem;
	}

	.info-value {
		color: #333;
		font-size: 0.95rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
		background: #28a745;
		color: white;
	}

	.badge.admin {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.actions-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: 8px;
		background: #f8f9fa;
		text-decoration: none;
		color: inherit;
		transition: all 0.3s ease;
		border: 2px solid transparent;
	}

	.action-item:hover {
		background: #e9ecef;
		border-color: #667eea;
		transform: translateX(5px);
	}

	.admin-action {
		background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
	}

	.admin-action:hover {
		background: linear-gradient(135deg, #ffd89b 0%, #fa9b7f 100%);
	}

	.action-icon {
		font-size: 2rem;
		min-width: 50px;
		text-align: center;
	}

	.action-text h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.action-text p {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.stat-item {
		text-align: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: bold;
		color: #667eea;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.85rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	@media (max-width: 768px) {
		.dashboard-header {
			padding: 1rem;
		}

		.header-content {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.dashboard-header h1 {
			font-size: 1.5rem;
		}

		.dashboard-main {
			padding: 0 1rem;
		}

		.dashboard-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
