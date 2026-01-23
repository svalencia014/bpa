<script lang="ts">
	import './layout.css';
	import { page } from "$app/state";
	import favicon from '$lib/assets/favicon.svg';


	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Button, paginationItem } from "flowbite-svelte";

	let { children } = $props();
	let activeUrl = $derived(page.url.pathname);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar class="bg-white">
	<NavBrand href="/">
		<!--Todo: Add horizontal BPA logo-->
		<!-- Placeholder: -->
		<p>Flashes BPA</p>
	</NavBrand>
	<div class="flex md:order-2">
		{#if page.data.user == null}
			<Button size="sm" href="/login">Login</Button>
		{:else}
			<Button size="sm" href="/logout">Logout</Button>
		{/if}
		<NavHamburger />
	</div>
	<NavUl {activeUrl}>
		<NavLi href="/">Home</NavLi>
		<NavLi href="/dashboard">Dashboard</NavLi>

		
	</NavUl>
</Navbar>

<div class="pt-2">
	{@render children()}
</div>
