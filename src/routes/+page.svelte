<script lang="ts">
	import { Button, Card } from 'flowbite-svelte';
	import {
		AwardSolid,
		CalendarEditSolid,
		HeartSolid,
		InfoCircleSolid,
		MessagesSolid,
		StarSolid
	} from 'flowbite-svelte-icons';
	import type { PageData } from './$types';

	type Announcement = PageData['announcements'][number];

	let { data }: { data: PageData } = $props();

	let announcements = $state<Announcement[]>([]);
	let title = $state('');
	let message = $state('');
	let feedError = $state('');
	let feedMessage = $state('');
	let feedSaving = $state(false);
	let deletingId = $state('');

	const currentUser = $derived(data.user);

	$effect(() => {
		announcements = data.announcements;
	});

	function formatTimestamp(value: Date | string) {
		return new Date(value).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function formatRelativeTime(value: Date | string) {
		const timestamp = new Date(value).getTime();
		const diff = Date.now() - timestamp;
		const minute = 60 * 1000;
		const hour = 60 * minute;
		const day = 24 * hour;

		if (diff < hour) {
			return `${Math.max(1, Math.floor(diff / minute))} min ago`;
		}
		if (diff < day) {
			return `${Math.floor(diff / hour)} hr ago`;
		}
		return `${Math.floor(diff / day)} day${Math.floor(diff / day) === 1 ? '' : 's'} ago`;
	}

	async function publishAnnouncement() {
		feedSaving = true;
		feedError = '';
		feedMessage = '';

		try {
			const response = await fetch('/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, message })
			});

			const result = await response.json();
			if (!response.ok) {
				feedError = result.error || 'Unable to publish announcement.';
				return;
			}

			announcements = [result.announcement, ...announcements];
			title = '';
			message = '';
			feedMessage = 'Announcement posted.';
		} catch (error) {
			feedError = 'Unable to publish announcement right now.';
			console.error('Announcement publish failed:', error);
		} finally {
			feedSaving = false;
		}
	}

	async function deleteAnnouncement(announcementId: string) {
		if (!confirm('Remove this announcement from the homepage feed?')) return;

		deletingId = announcementId;
		feedError = '';
		feedMessage = '';

		try {
			const response = await fetch('/', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ announcementId })
			});

			const result = await response.json();
			if (!response.ok) {
				feedError = result.error || 'Unable to remove announcement.';
				return;
			}

			announcements = announcements.filter((announcement) => announcement.id !== announcementId);
			feedMessage = 'Announcement removed.';
		} catch (error) {
			feedError = 'Unable to remove announcement right now.';
			console.error('Announcement delete failed:', error);
		} finally {
			deletingId = '';
		}
	}
</script>

<svelte:head>
	<title>Flashes BPA - Home</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
	<div class="mx-auto max-w-7xl">
		<div class="mb-8">
			<div
				class="flex items-center justify-between rounded-3xl border border-blue-100 bg-white px-8 py-8 shadow-[0_24px_80px_rgba(37,99,235,0.12)]"
			>
				<div class="max-w-3xl">
					<p class="mb-3 text-xs font-semibold tracking-[0.26em] text-blue-600 uppercase">
						Sponsor Updates
					</p>
					<h1 class="text-4xl font-bold text-gray-900">Welcome to Flashes BPA</h1>
					<p class="mt-3 text-lg text-gray-600">
						Real-time chapter announcements, upcoming events, and important logistics all in one
						place.
					</p>
				</div>
				<div
					class="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-xl"
				>
					BPA
				</div>
			</div>
		</div>

		<div class="mb-8 rounded-3xl border border-blue-200 bg-blue-600 p-6 text-white shadow-xl">
			<div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold tracking-[0.22em] text-blue-100 uppercase">
						Announcement Feed
					</p>
					<h2 class="mt-2 text-3xl font-bold">Live updates from your sponsor</h2>
					<p class="mt-2 text-blue-50">
						Changes like room moves, departure times, dress reminders, and urgent schedule updates
						appear here first.
					</p>
				</div>
				<div class="rounded-2xl bg-white/12 px-4 py-3 text-sm font-medium text-blue-50">
					{announcements.length} recent update{announcements.length === 1 ? '' : 's'}
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				{#if currentUser?.isAdmin}
					<Card class="rounded-3xl border border-blue-100 shadow-lg">
						<div class="mb-4 flex items-center justify-between gap-3">
							<div>
								<h2 class="text-2xl font-bold text-gray-900">Post Sponsor Announcement</h2>
								<p class="text-sm text-gray-500">
									Publish updates directly to the homepage feed for every member.
								</p>
							</div>
						</div>
						<div class="grid gap-3">
							<input
								class="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
								placeholder="Announcement title"
								bind:value={title}
							/>
							<textarea
								class="min-h-32 rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
								placeholder="Share the full sponsor update here"
								bind:value={message}
							></textarea>
							<div class="flex flex-wrap items-center gap-3">
								<Button onclick={publishAnnouncement} disabled={feedSaving}>
									{feedSaving ? 'Posting...' : 'Post Update'}
								</Button>
								{#if feedMessage}
									<p class="text-sm font-medium text-emerald-700">{feedMessage}</p>
								{/if}
								{#if feedError}
									<p class="text-sm font-medium text-red-600">{feedError}</p>
								{/if}
							</div>
						</div>
					</Card>
				{/if}

				<Card class="rounded-3xl border border-slate-200 shadow-lg">
					<div class="mb-5 flex items-center justify-between gap-3">
						<div>
							<h2 class="text-2xl font-bold text-gray-900">Announcement Feed</h2>
							<p class="text-sm text-gray-500">
								The latest sponsor messages are pinned here in reverse chronological order.
							</p>
						</div>
					</div>

					{#if announcements.length}
						<div class="space-y-4">
							{#each announcements as announcement}
								<article
									class="rounded-2xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-5 shadow-sm"
								>
									<div class="flex flex-wrap items-start justify-between gap-4">
										<div class="max-w-3xl">
											<div class="mb-2 flex flex-wrap items-center gap-2">
												<span
													class="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-blue-700 uppercase"
												>
													Sponsor update
												</span>
												<span class="text-xs font-medium text-slate-500">
													{formatRelativeTime(announcement.createdAt)}
												</span>
											</div>
											<h3 class="text-xl font-bold text-gray-900">{announcement.title}</h3>
											<p class="mt-2 whitespace-pre-wrap text-gray-700">{announcement.message}</p>
											<p class="mt-3 text-xs text-slate-500">
												Posted by {announcement.author.name} on {formatTimestamp(
													announcement.createdAt
												)}
											</p>
										</div>
										{#if currentUser?.isAdmin}
											<button
												type="button"
												onclick={() => deleteAnnouncement(announcement.id)}
												disabled={deletingId === announcement.id}
												class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
											>
												{deletingId === announcement.id ? 'Removing...' : 'Delete'}
											</button>
										{/if}
									</div>
								</article>
							{/each}
						</div>
					{:else}
						<div
							class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
						>
							<h3 class="text-lg font-semibold text-slate-800">No sponsor announcements yet</h3>
							<p class="mt-2 text-sm text-slate-500">
								When a sponsor posts an update, it will appear here prominently on the homepage.
							</p>
						</div>
					{/if}

					{#if feedError && !currentUser?.isAdmin}
						<p class="mt-4 text-sm font-medium text-red-600">{feedError}</p>
					{/if}
				</Card>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<a href="/info" class="group">
						<Card
							class="flex h-40 flex-col items-center justify-center rounded-3xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-500 group-hover:shadow-lg"
						>
							<InfoCircleSolid
								class="mb-3 h-12 w-12 text-blue-600 transition-transform group-hover:scale-110"
							/>
							<p class="text-center font-semibold text-gray-800">General Information</p>
						</Card>
					</a>
					<a href="/calendar" class="group">
						<Card
							class="flex h-40 flex-col items-center justify-center rounded-3xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-500 group-hover:shadow-lg"
						>
							<CalendarEditSolid
								class="mb-3 h-12 w-12 text-blue-600 transition-transform group-hover:scale-110"
							/>
							<p class="text-center font-semibold text-gray-800">Calendar</p>
						</Card>
					</a>
					<a href="/contact" class="group">
						<Card
							class="flex h-40 flex-col items-center justify-center rounded-3xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-500 group-hover:shadow-lg"
						>
							<MessagesSolid
								class="mb-3 h-12 w-12 text-blue-600 transition-transform group-hover:scale-110"
							/>
							<p class="text-center font-semibold text-gray-800">Contact</p>
						</Card>
					</a>
					<a href="/wsap" class="group">
						<Card
							class="flex h-40 flex-col items-center justify-center rounded-3xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-500 group-hover:shadow-lg"
						>
							<StarSolid
								class="mb-3 h-12 w-12 text-blue-600 transition-transform group-hover:scale-110"
							/>
							<p class="text-center font-semibold text-gray-800">W/SAP</p>
						</Card>
					</a>
					<a href="/bpa-cares" class="group">
						<Card
							class="flex h-40 flex-col items-center justify-center rounded-3xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-500 group-hover:shadow-lg"
						>
							<HeartSolid
								class="mb-3 h-12 w-12 text-blue-600 transition-transform group-hover:scale-110"
							/>
							<p class="text-center font-semibold text-gray-800">BPA Cares</p>
						</Card>
					</a>
					<a href="/torch-awards" class="group">
						<Card
							class="flex h-40 flex-col items-center justify-center rounded-3xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-500 group-hover:shadow-lg"
						>
							<AwardSolid
								class="mb-3 h-12 w-12 text-blue-600 transition-transform group-hover:scale-110"
							/>
							<p class="text-center font-semibold text-gray-800">Torch Awards</p>
						</Card>
					</a>
				</div>
			</div>

			<div class="space-y-6 lg:col-span-1">
				<Card class="sticky top-6 rounded-3xl border border-blue-100 px-2 py-2 shadow-lg">
					<h3 class="mb-4 border-b-2 border-blue-600 pb-2 text-xl font-bold text-gray-800">
						Feed Highlights
					</h3>
					<div class="space-y-3">
						{#each announcements.slice(0, 3) as announcement}
							<div class="rounded-2xl border-l-4 border-blue-600 bg-blue-50 p-3">
								<p class="text-sm font-semibold text-gray-800">{announcement.title}</p>
								<p class="mt-1 line-clamp-3 text-xs text-gray-600">{announcement.message}</p>
								<p class="mt-2 text-[11px] font-medium text-blue-700">
									{formatRelativeTime(announcement.createdAt)}
								</p>
							</div>
						{/each}
						{#if announcements.length === 0}
							<div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
								<p class="text-sm text-slate-500">The latest sponsor updates will surface here.</p>
							</div>
						{/if}
					</div>
				</Card>

				<Card class="rounded-3xl border border-slate-200 px-2 py-2 shadow-lg">
					<h3 class="mb-4 border-b-2 border-blue-600 pb-2 text-xl font-bold text-gray-800">
						Quick Look
					</h3>
					<div class="space-y-3">
						<div class="rounded-2xl bg-slate-50 p-3">
							<p class="text-sm font-semibold text-gray-800">Live sponsor communication</p>
							<p class="mt-1 text-xs text-gray-600">
								Room changes, departure times, reminders, and urgent updates are front and center.
							</p>
						</div>
						<div class="rounded-2xl bg-slate-50 p-3">
							<p class="text-sm font-semibold text-gray-800">Recent-first feed</p>
							<p class="mt-1 text-xs text-gray-600">
								New announcements appear first so members see the latest information immediately.
							</p>
						</div>
						<div class="rounded-2xl bg-slate-50 p-3">
							<p class="text-sm font-semibold text-gray-800">Sponsor-controlled</p>
							<p class="mt-1 text-xs text-gray-600">
								Admins can publish and remove announcements without editing code or touching the
								database directly.
							</p>
						</div>
					</div>
				</Card>
			</div>
		</div>
	</div>
</div>
