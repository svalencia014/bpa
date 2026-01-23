<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let email = $state('');
  let memberId = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state('');

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const submitInvitation = async (event: Event) => {
    event.preventDefault();
    loading = true;
    error = '';
    success = '';

    try {
      const response = await fetch('/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, memberId })
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Failed to create invitation');

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

<div class="min-h-screen bg-slate-900 text-slate-100">
  <div class="max-w-5xl mx-auto px-4 py-8 lg:px-6 lg:py-10 space-y-6">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Admin</p>
      <h1 class="text-3xl font-bold text-slate-50">User Management</h1>
      <p class="text-slate-400 max-w-3xl">
        Invite students with their BPA member ID and email. Existing users are listed below.
      </p>
    </header>

    <section class="grid gap-4 lg:gap-6 md:grid-cols-2">
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl shadow-xl">
        <div class="border-b border-slate-800 px-5 py-4 space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Invitations</p>
          <h2 class="text-lg font-semibold text-slate-50">Invite a student</h2>
          <p class="text-sm text-slate-400">Students are invited; accounts are created when they accept.</p>
        </div>
        <div class="px-5 py-5">
          <form class="space-y-4" onsubmit={submitInvitation}>
            <label class="flex flex-col gap-2 text-sm font-semibold text-slate-200">
              <span>Email</span>
              <input
                type="email"
                name="email"
                bind:value={email}
                required
                placeholder="student@example.com"
                class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-semibold text-slate-200">
              <span>BPA Member ID</span>
              <input
                type="text"
                name="memberId"
                bind:value={memberId}
                required
                placeholder="e.g. 123456"
                class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              />
            </label>

            <div class="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                class="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-sky-400 to-violet-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-violet-500/30 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-violet-400/60 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {#if loading}Sending…{/if}
                {#if !loading}Send invite{/if}
              </button>
            </div>

            {#if error}
              <p class="text-sm text-rose-400">{error}</p>
            {/if}
            {#if success}
              <p class="text-sm text-emerald-400">{success}</p>
            {/if}
          </form>
        </div>
      </div>

      <div class="bg-slate-950/70 border border-slate-800 rounded-xl shadow-xl">
        <div class="border-b border-slate-800 px-5 py-4 space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Pending</p>
          <h2 class="text-lg font-semibold text-slate-50">Active invitations</h2>
          <p class="text-sm text-slate-400">Unexpired, unused invites.</p>
        </div>
        <div class="px-5 py-5">
          {#if data.invitations.length === 0}
            <p class="text-sm text-slate-400">No active invitations.</p>
          {:else}
            <div class="grid gap-2">
              <div class="grid grid-cols-[1.5fr_1fr_1fr] items-center gap-3 text-sm text-slate-400 border-b border-slate-800 pb-2">
                <span>Email</span>
                <span>Member ID</span>
                <span>Expires</span>
              </div>
              {#each data.invitations as invite}
                <div class="grid grid-cols-[1.5fr_1fr_1fr] items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-100 odd:bg-white/5">
                  <span class="truncate">{invite.email}</span>
                  <span class="truncate">{invite.memberId}</span>
                  <span class="truncate">{formatDate(invite.expiresAt)}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </section>

    <section class="bg-slate-950/70 border border-slate-800 rounded-xl shadow-xl">
      <div class="border-b border-slate-800 px-5 py-4 space-y-1">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Directory</p>
        <h2 class="text-lg font-semibold text-slate-50">Existing users</h2>
        <p class="text-sm text-slate-400">Admins are marked; students are invited, not directly created.</p>
      </div>
      <div class="px-5 py-5">
        {#if data.users.length === 0}
          <p class="text-sm text-slate-400">No users yet.</p>
        {:else}
          <div class="grid gap-2">
            <div class="hidden md:grid grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.9fr] items-center gap-3 text-sm text-slate-400 border-b border-slate-800 pb-2">
              <span>Name</span>
              <span>Email</span>
              <span>Member ID</span>
              <span>Role</span>
              <span>Joined</span>
            </div>

            {#each data.users as user}
              <div class="grid gap-2 rounded-lg px-2 py-3 text-sm text-slate-100 border border-slate-800/60 bg-slate-950/40 md:border-0 md:bg-transparent md:grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.9fr] md:items-center md:gap-3 md:px-0 md:py-0 md:odd:bg-white/5">
                <div class="font-semibold truncate">{user.name}</div>
                <div class="truncate text-slate-200">{user.email}</div>
                <div class="truncate text-slate-200">{user.memberId ?? '—'}</div>
                <div>
                  {#if user.isAdmin}
                    <span class="inline-flex items-center rounded-full bg-linear-to-r from-rose-400 to-orange-400 px-3 py-1 text-xs font-semibold text-slate-950">Admin</span>
                  {:else}
                    <span class="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100">User</span>
                  {/if}
                </div>
                <div class="text-slate-200">{formatDate(user.createdAt)}</div>

                <div class="md:hidden flex flex-wrap gap-2 text-xs text-slate-400">
                  <span class="px-2 py-1 rounded bg-slate-800/60">Role: {user.isAdmin ? 'Admin' : 'User'}</span>
                  <span class="px-2 py-1 rounded bg-slate-800/60">Joined: {formatDate(user.createdAt)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </section>
  </div>
</div>
