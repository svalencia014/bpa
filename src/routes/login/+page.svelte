<script lang="ts">
	import { onMount } from "svelte";

  let username = $state('');
  let password = $state('');

  async function handleUsernameLogin() {
    const req = await fetch("/login/", {
      method: 'POST'
    })
  }

  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleUsernameLogin();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handler);
    }

    return () => {
      document.removeEventListener("keydown", handler);
    }
  });
</script>

<div class="flex h-screen items-center justify-center">
  <div class="relative w-full max-w-sm rounded-lg border border-gray-300 bg-white p-8 shadow-lg">
    <div class="mb-4">
      <label for="username" class="mb-2 block text-xs font-bold text-gray-700">Username</label>
      <input
        id="username"
        type="text"
        class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 text-sm leading-tight text-gray-700 shadow focus:outline-none"
        bind:value={username}
      />
    </div>
    <div class="mb-6">
      <label for="password" class="mb-2 block text-xs font-bold text-gray-700">Password</label>
      <input
        id="username"
        type="text"
        class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 text-sm leading-tight text-gray-700 shadow focus:outline-none"
        bind:value={password}
      />
    </div>

    <button
      class="focus:shadow-outline w-full rounded bg-red-500 px-4 py-2 text-sm font-bold text-white hover:cursor-pointer hover:bg-red-700 focus:outline-none"
      type="button"
      onclick={handleUsernameLogin}
    >Sign In</button>
  </div>
</div>