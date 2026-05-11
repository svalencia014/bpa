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

<div
	class="min-h-screen bg-linear-to-br from-indigo-500 via-purple-500 to-violet-600 text-slate-50"
>
	<div class="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-8 lg:py-12">
		<header class="flex flex-col gap-2">
			<p class="text-xs font-semibold tracking-[0.14em] text-slate-200/80 uppercase">Welcome</p>
			<h1 class="text-3xl leading-tight font-bold">Dashboard</h1>
			<p class="text-slate-100/80">Overview of your account, quick links, and stats.</p>
		</header>

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- Profile Card -->
			<div
				class="rounded-xl border border-white/15 bg-white/10 shadow-xl backdrop-blur md:col-span-2"
			>
				<div class="border-b border-white/10 px-6 py-4">
					<h2 class="text-lg font-semibold">Profile Information</h2>
				</div>
				<div class="space-y-4 px-6 py-5">
					<div class="flex items-center gap-3">
						<div
							class="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-lg font-bold"
						>
							{data.user.name.slice(0, 1)}
						</div>
						<div>
							<p class="text-sm text-slate-100/80">Signed in as</p>
							<p class="text-lg font-semibold">{data.user.name}</p>
						</div>
					</div>

					<div class="divide-y divide-white/10 rounded-lg border border-white/10 bg-white/5">
						<div class="flex justify-between gap-4 px-4 py-3">
							<span class="text-sm text-slate-100/80">Email</span>
							<span class="font-medium">{data.user.email}</span>
						</div>
						{#if data.user.memberId}
							<div class="flex justify-between gap-4 px-4 py-3">
								<span class="text-sm text-slate-100/80">Member ID</span>
								<span class="font-medium">{data.user.memberId}</span>
							</div>
						{/if}
						<div class="flex justify-between gap-4 px-4 py-3">
							<span class="text-sm text-slate-100/80">Account Type</span>
							<span
								class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${data.user.isAdmin ? 'bg-linear-to-r from-pink-400 to-orange-400 text-slate-900' : 'bg-emerald-500/90 text-white'}`}
							>
								{data.user.isAdmin ? 'Admin' : 'User'}
							</span>
						</div>
						<div class="flex justify-between gap-4 px-4 py-3">
							<span class="text-sm text-slate-100/80">Member Since</span>
							<span class="font-medium">{formatDate(data.user.createdAt)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions Card -->
			<div class="rounded-xl border border-white/15 bg-white/10 shadow-xl backdrop-blur">
				<div class="border-b border-white/10 px-5 py-4">
					<h2 class="text-lg font-semibold">Quick Actions</h2>
				</div>
				<div class="space-y-3 px-5 py-5">
					<a
						href="/calendar"
						class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:border-white/30 hover:bg-white/10"
					>
						<span class="text-xl">📅</span>
						<div>
							<p class="text-base font-semibold">Calendar</p>
							<p class="text-sm text-slate-100/80">View upcoming events</p>
						</div>
					</a>
					<a
						href="/"
						class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:border-white/30 hover:bg-white/10"
					>
						<span class="text-xl">🏠</span>
						<div>
							<p class="text-base font-semibold">Home</p>
							<p class="text-sm text-slate-100/80">Back to home page</p>
						</div>
					</a>
					{#if data.user.isAdmin}
						<a
							href="/admin/users"
							class="flex items-center gap-3 rounded-lg border border-white/10 bg-linear-to-r from-amber-200/80 via-pink-200/80 to-rose-200/80 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:shadow-lg"
						>
							<span class="text-xl">👥</span>
							<div>
								<p class="text-base font-semibold">Manage Users</p>
								<p class="text-sm text-slate-800">Admin panel</p>
							</div>
						</a>
					{/if}
				</div>
			</div>

			<!-- Account Stats Card -->
			<div class="rounded-xl border border-white/15 bg-white/10 shadow-xl backdrop-blur">
				<div class="border-b border-white/10 px-5 py-4">
					<h2 class="text-lg font-semibold">Account Overview</h2>
				</div>
				<div class="grid gap-4 px-5 py-5 sm:grid-cols-3">
					<div class="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center">
						<p class="text-2xl font-bold">
							{Math.floor(
								(Date.now() - new Date(data.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
							)}
						</p>
						<p class="text-xs tracking-wide text-slate-100/80 uppercase">Days Active</p>
					</div>
					<div class="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center">
						<p class="text-2xl font-bold">{data.user.isAdmin ? '✓' : '—'}</p>
						<p class="text-xs tracking-wide text-slate-100/80 uppercase">Admin Access</p>
					</div>
					<div class="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center">
						<p class="text-2xl font-bold">✓</p>
						<p class="text-xs tracking-wide text-slate-100/80 uppercase">Active</p>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-white/15 bg-white/10 shadow-xl backdrop-blur">
				<div class="border-b border-white/10 px-5 py-4">
					<h2 class="text-lg font-semibold">Eligibility Attendance</h2>
				</div>
				<div class="space-y-4 px-5 py-5">
					<div class="flex items-center justify-between gap-4">
						<div>
							<p class="text-sm text-slate-100/80">Mandatory meetings and practice sessions</p>
							<p class="text-2xl font-bold">
								{data.attendanceSummary.presentCount + data.attendanceSummary.excusedCount}/
								{data.attendanceSummary.pastMandatoryEvents}
							</p>
						</div>
						<span
							class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
								data.attendanceSummary.eligibilityLabel === 'Eligible'
									? 'bg-emerald-500 text-white'
									: data.attendanceSummary.eligibilityLabel === 'Review needed'
										? 'bg-amber-300 text-slate-900'
										: 'bg-white/15 text-white'
							}`}
						>
							{data.attendanceSummary.eligibilityLabel}
						</span>
					</div>
					<div class="grid grid-cols-3 gap-3 text-center">
						<div class="rounded-lg border border-white/15 bg-white/5 px-3 py-3">
							<p class="text-xl font-bold">{data.attendanceSummary.presentCount}</p>
							<p class="text-xs tracking-wide text-slate-100/80 uppercase">Present</p>
						</div>
						<div class="rounded-lg border border-white/15 bg-white/5 px-3 py-3">
							<p class="text-xl font-bold">{data.attendanceSummary.excusedCount}</p>
							<p class="text-xs tracking-wide text-slate-100/80 uppercase">Excused</p>
						</div>
						<div class="rounded-lg border border-white/15 bg-white/5 px-3 py-3">
							<p class="text-xl font-bold">{data.attendanceSummary.absentCount}</p>
							<p class="text-xs tracking-wide text-slate-100/80 uppercase">Absent</p>
						</div>
					</div>
					<a
						href="/calendar"
						class="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:border-white/30 hover:bg-white/10"
					>
						View attendance calendar
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
