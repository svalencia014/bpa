<script lang="ts">
	import { Card, Button } from "flowbite-svelte";
	import { 
		InfoCircleSolid,
		CalendarEditSolid,
		MessagesSolid,
		StarSolid,
		HeartSolid,
		AwardSolid 
	} from "flowbite-svelte-icons";
</script>

<svelte:head>
	<title>Flashes BPA - Home</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header Section -->
		<div class="mb-8">
			<div class="bg-white rounded-lg shadow-md p-8 flex items-center justify-between">
				<div>
					<h1 class="text-4xl font-bold text-gray-800">Welcome to Flashes BPA</h1>
					<p class="text-gray-600 mt-2">Business Professional Association</p>
				</div>
				<div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
					<span class="text-white font-bold text-sm">1B2456</span>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main Content Area -->
			<div class="lg:col-span-2">
				<!-- Navigation Grid -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<!-- General Information -->
					<a href="/info" class="group">
						<Card class="h-40 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-300 group-hover:-translate-y-1">
							<InfoCircleSolid class="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
							<p class="text-gray-800 font-semibold text-center">General Information</p>
						</Card>
					</a>

					<!-- Calendar -->
					<a href="/calendar" class="group">
						<Card class="h-40 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-300 group-hover:-translate-y-1">
							<CalendarEditSolid class="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
							<p class="text-gray-800 font-semibold text-center">Calendar</p>
						</Card>
					</a>

					<!-- Contact -->
					<a href="/contact" class="group">
						<Card class="h-40 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-300 group-hover:-translate-y-1">
							<MessagesSolid class="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
							<p class="text-gray-800 font-semibold text-center">Contact</p>
						</Card>
					</a>

					<!-- W/SAP -->
					<a href="/wsap" class="group">
						<Card class="h-40 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-300 group-hover:-translate-y-1">
							<StarSolid class="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
							<p class="text-gray-800 font-semibold text-center">W/SAP</p>
						</Card>
					</a>

					<!-- BPA Cares -->
					<a href="/bpa-cares" class="group">
						<Card class="h-40 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-300 group-hover:-translate-y-1">
							<HeartSolid class="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
							<p class="text-gray-800 font-semibold text-center">BPA Cares</p>
						</Card>
					</a>

					<!-- Torch Awards -->
					<a href="/torch-awards" class="group">
						<Card class="h-40 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-300 group-hover:-translate-y-1">
							<AwardSolid class="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
							<p class="text-gray-800 font-semibold text-center">Torch Awards</p>
						</Card>
					</a>
				</div>

				<!-- Recent Activity Section -->
				<Card class="shadow-md">
					<h2 class="text-2xl font-bold text-gray-800 mb-4">Recent Activity</h2>
					<div class="space-y-3">
						<div class="flex items-center p-3 bg-gray-50 rounded-lg">
							<div class="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
							<p class="text-gray-700">New calendar event added</p>
							<span class="ml-auto text-sm text-gray-500">2 hours ago</span>
						</div>
						<div class="flex items-center p-3 bg-gray-50 rounded-lg">
							<div class="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
							<p class="text-gray-700">You have a new message</p>
							<span class="ml-auto text-sm text-gray-500">1 day ago</span>
						</div>
						<div class="flex items-center p-3 bg-gray-50 rounded-lg">
							<div class="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
							<p class="text-gray-700">Meeting reminder</p>
							<span class="ml-auto text-sm text-gray-500">3 days ago</span>
						</div>
					</div>
				</Card>
			</div>

			<!-- Sidebar -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Reminders Section -->
				<Card class="shadow-md sticky top-6 px-2 py-2">
					<h3 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">Reminders</h3>
					<div class="space-y-3">
						<div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600">
							<p class="text-sm font-semibold text-gray-800">Upcoming Meeting</p>
							<p class="text-xs text-gray-600 mt-1">May 5, 2026</p>
						</div>
						<div class="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-600">
							<p class="text-sm font-semibold text-gray-800">Project Deadline</p>
							<p class="text-xs text-gray-600 mt-1">May 10, 2026</p>
						</div>
						<div class="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-600">
							<p class="text-sm font-semibold text-gray-800">Submit Report</p>
							<p class="text-xs text-gray-600 mt-1">May 15, 2026</p>
						</div>
					</div>
				</Card>

				<!-- Messages Section -->
				<Card class="shadow-md px-2 py-2">
					<h3 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">Messages</h3>
					<div class="space-y-3">
						<div class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
							<div class="w-10 h-10 bg-linear-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
								J
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold text-gray-800 truncate">John</p>
								<p class="text-xs text-gray-500 truncate">Sounds good!</p>
							</div>
						</div>
						<div class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
							<div class="w-10 h-10 bg-linear-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
								S
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold text-gray-800 truncate">Sarah</p>
								<p class="text-xs text-gray-500 truncate">See you tomorrow!</p>
							</div>
						</div>
					</div>
					<Button class="w-full mt-4" size="sm" outline>View All Messages</Button>
				</Card>
			</div>
		</div>
	</div>
</div>