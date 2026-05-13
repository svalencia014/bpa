<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	type CalendarEventRecord = PageData['events'][number];
	type MemberRecord = PageData['members'][number];
	type AttendanceRecord = CalendarEventRecord['attendances'][number];
	type AttendanceChoice = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'UNMARKED';

	type CalendarTask = {
		type: 'task';
		text: string;
		createdAt: number;
		done: boolean;
	};

	type CalendarEventForm = {
		type: 'event';
		name: string;
		start: string;
		end: string;
		location: string;
		eventType: 'MEETING' | 'PRACTICE' | 'OTHER';
		mandatory: boolean;
		createdAt: Date;
	};

	type CalendarEventItem = {
		type: 'event';
		id: string;
		name: string;
		start: string;
		end: string;
		location: string;
		eventType: CalendarEventRecord['eventType'];
		mandatory: boolean;
		createdAt: Date;
	};

	type CalendarItem = CalendarTask | CalendarEventItem;

	let { data }: { data: PageData } = $props();

	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const currentUser = $derived(data.user);
	const members = $derived(data.members as MemberRecord[]);

	let events = $state<CalendarEventRecord[]>([]);
	let today = $state(new Date());
	let displayed = $state(new Date());
	let selected = $state<Date | null>(null);
	let selectedTrackedEventId = $state('');
	let newEvent: CalendarEventForm | undefined = $state(undefined);
	let showEventForm = $state(false);
	let eventError = $state('');
	let attendanceError = $state('');
	let attendanceMessage = $state('');
	let eventSaving = $state(false);
	let eventDeleting = $state(false);
	let attendanceSavingKey = $state('');
	let tasks = $state<Record<string, CalendarItem[]>>({});

	function prevMonth() {
		displayed = new Date(displayed.getFullYear(), displayed.getMonth() - 1, 1);
	}

	function nextMonth() {
		displayed = new Date(displayed.getFullYear(), displayed.getMonth() + 1, 1);
	}

	function goToToday() {
		today = new Date();
		displayed = new Date(today.getFullYear(), today.getMonth(), 1);
		selected = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	}

	function selectDay(day: number) {
		if (!day) return;
		selected = new Date(displayed.getFullYear(), displayed.getMonth(), day);
	}

	function dateKeyFromParts(year: number, monthIndex: number, day: number) {
		const mm = String(monthIndex + 1).padStart(2, '0');
		const dd = String(day).padStart(2, '0');
		return `${year}-${mm}-${dd}`;
	}

	function dateKey(dateObj: Date | null) {
		if (!dateObj) return '';
		return dateKeyFromParts(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
	}

	function toDatetimeLocalValue(dateObj: Date) {
		const year = dateObj.getFullYear();
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getDate()).padStart(2, '0');
		const hours = String(dateObj.getHours()).padStart(2, '0');
		const minutes = String(dateObj.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	function getDefaultEvent(baseDate: Date = selected ?? today): CalendarEventForm {
		const startDate = new Date(baseDate);
		startDate.setHours(15, 0, 0, 0);
		const endDate = new Date(startDate);
		endDate.setHours(startDate.getHours() + 1);

		return {
			type: 'event',
			name: '',
			start: toDatetimeLocalValue(startDate),
			end: toDatetimeLocalValue(endDate),
			location: '',
			eventType: 'OTHER',
			mandatory: false,
			createdAt: new Date()
		};
	}

	function formatEventTime(value: Date | string): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return String(value);
		return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}

	function formatEventType(value: CalendarEventRecord['eventType']) {
		if (value === 'MEETING') return 'Meeting';
		if (value === 'PRACTICE') return 'Practice';
		return 'Event';
	}

	function mapDbEvent(event: CalendarEventRecord): CalendarEventItem {
		return {
			type: 'event',
			id: event.id,
			name: event.name,
			start: formatEventTime(event.dateStart),
			end: formatEventTime(event.dateEnd),
			location: event.location ?? '',
			eventType: event.eventType,
			mandatory: event.mandatory,
			createdAt: event.createdAt
		};
	}

	function isTaskItem(item: CalendarItem): item is CalendarTask {
		return item.type === 'task';
	}

	function isEventItem(item: CalendarItem): item is CalendarEventItem {
		return item.type === 'event';
	}

	function syncEventsIntoTasks() {
		const taskEntries = Object.entries(tasks).flatMap(([key, items]) =>
			items.filter((item) => item.type === 'task').map((item) => [key, item] as const)
		);

		const nextTasks: Record<string, CalendarItem[]> = {};

		for (const [key, item] of taskEntries) {
			nextTasks[key] = nextTasks[key] || [];
			nextTasks[key].push(item);
		}

		for (const event of events) {
			const eventDate = new Date(event.dateStart);
			const key = dateKey(eventDate);
			if (!key) continue;
			nextTasks[key] = nextTasks[key] || [];
			nextTasks[key].push(mapDbEvent(event));
		}

		tasks = nextTasks;
	}

	function getSelectedEventRecord() {
		return events.find((event) => event.id === selectedTrackedEventId);
	}

	function getAttendanceStatus(event: CalendarEventRecord, memberId: string): AttendanceChoice {
		const existing = event.attendances.find((attendance) => attendance.userId === memberId);
		return existing?.status ?? 'UNMARKED';
	}

	function upsertAttendance(eventId: string, attendance: AttendanceRecord) {
		events = events.map((event) => {
			if (event.id !== eventId) return event;

			const filtered = event.attendances.filter((entry) => entry.userId !== attendance.userId);
			return {
				...event,
				attendances: [...filtered, attendance].sort((left, right) =>
					left.user.name.localeCompare(right.user.name)
				)
			};
		});

		syncEventsIntoTasks();
	}

	async function addEvent() {
		if (!newEvent) return;
		eventSaving = true;
		eventError = '';

		const payload = {
			name: newEvent.name,
			dateStart: newEvent.start,
			dateEnd: newEvent.end,
			location: newEvent.location || undefined,
			eventType: newEvent.eventType,
			mandatory: newEvent.mandatory
		};

		try {
			const response = await fetch('/calendar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await response.json();
			if (!response.ok) {
				eventError = result.error || 'Could not save event.';
				return;
			}

			events = [...events, result].sort(
				(left, right) => new Date(left.dateStart).getTime() - new Date(right.dateStart).getTime()
			);
			syncEventsIntoTasks();
			selectedTrackedEventId = result.id;
			showEventForm = false;
			newEvent = getDefaultEvent(selected ?? today);
		} catch (error) {
			eventError = 'Unable to save event.';
			console.error('Event save failed:', error);
		} finally {
			eventSaving = false;
		}
	}

	async function updateAttendance(
		eventId: string,
		userId: string,
		status: Exclude<AttendanceChoice, 'UNMARKED'>
	) {
		attendanceSavingKey = `${eventId}:${userId}`;
		attendanceError = '';
		attendanceMessage = '';

		try {
			const response = await fetch('/calendar', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventId, userId, status })
			});

			const result = await response.json();
			if (!response.ok) {
				attendanceError = result.error || 'Unable to update attendance for this member right now.';
				return;
			}

			upsertAttendance(eventId, result.attendance);
			attendanceMessage = 'Attendance saved.';
		} catch (error) {
			attendanceError = 'Unable to update attendance right now.';
			console.error('Attendance update failed:', error);
		} finally {
			attendanceSavingKey = '';
		}
	}

	async function deleteEvent(eventId: string) {
		if (!confirm('Remove this event from the calendar?')) return;

		eventDeleting = true;
		eventError = '';
		attendanceError = '';
		attendanceMessage = '';

		try {
			const response = await fetch('/calendar', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventId })
			});

			const result = await response.json();
			if (!response.ok) {
				eventError = result.error || 'Unable to remove this event right now.';
				return;
			}

			events = events.filter((event) => event.id !== eventId);
			syncEventsIntoTasks();
			selectedTrackedEventId = '';
		} catch (error) {
			eventError = 'Unable to remove this event right now.';
			console.error('Event delete failed:', error);
		} finally {
			eventDeleting = false;
		}
	}

	function toggleEventForm() {
		if (!newEvent) newEvent = getDefaultEvent(selected ?? today);
		showEventForm = !showEventForm;
	}

	function removeTask(key: string, idx: number) {
		if (!tasks[key]) return;
		const item = tasks[key][idx];
		if (!item || !isTaskItem(item)) return;

		tasks[key].splice(idx, 1);
		if (tasks[key].length === 0) delete tasks[key];
		tasks = { ...tasks };
	}

	const grid = $derived.by(() => {
		const year = displayed.getFullYear();
		const month = displayed.getMonth();
		const firstDow = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const prevDays = new Date(year, month, 0).getDate();

		const cells = [];
		for (let i = firstDow - 1; i >= 0; i--) {
			cells.push({ day: prevDays - i, inMonth: false });
		}

		for (let d = 1; d <= daysInMonth; d++) {
			cells.push({ day: d, inMonth: true });
		}

		while (cells.length < 42) {
			cells.push({ day: cells.length - (firstDow + daysInMonth) + 1, inMonth: false });
		}

		return cells;
	});

	const selectedItems = $derived(tasks[dateKey(selected)] ?? []);
	const selectedEvent = $derived(getSelectedEventRecord());
	const attendanceRows = $derived.by(() => {
		if (!currentUser.isAdmin || !selectedEvent) return [];

		return members.map((member) => ({
			...member,
			status: getAttendanceStatus(selectedEvent, member.id)
		}));
	});

	$effect(() => {
		events = data.events;
	});

	$effect(() => {
		const dateEvents = selectedItems.filter(isEventItem);
		if (dateEvents.length === 0) {
			selectedTrackedEventId = '';
			return;
		}

		if (!dateEvents.some((event) => event.id === selectedTrackedEventId)) {
			selectedTrackedEventId = dateEvents[0].id;
		}
	});

	function isTodayCell(cell: { day: number; inMonth: boolean }) {
		if (!cell.inMonth) return false;
		return (
			displayed.getFullYear() === today.getFullYear() &&
			displayed.getMonth() === today.getMonth() &&
			cell.day === today.getDate()
		);
	}

	function isSelectedCell(cell: { day: number; inMonth: boolean }) {
		if (!cell.inMonth || !selected) return false;
		return (
			displayed.getFullYear() === selected.getFullYear() &&
			displayed.getMonth() === selected.getMonth() &&
			cell.day === selected.getDate()
		);
	}

	onMount(() => {
		selected = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		displayed = new Date(today.getFullYear(), today.getMonth(), 1);
		syncEventsIntoTasks();
	});
</script>

<div
	class="box-border flex h-screen w-screen max-w-none flex-col rounded-xl border border-slate-300 bg-white p-3 font-sans"
	role="application"
	aria-label="Calendar"
>
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center">
			<button
				aria-label="Previous month"
				onclick={prevMonth}
				class="mx-1 rounded-md border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50"
			>
				&lt;
			</button>
			<button
				aria-label="Today"
				onclick={goToToday}
				class="mx-1 rounded-md border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50"
			>
				Today
			</button>
			<button
				aria-label="Next month"
				onclick={nextMonth}
				class="mx-1 rounded-md border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50"
			>
				&gt;
			</button>
		</div>
		<div class="font-semibold" aria-live="polite">
			{displayed.toLocaleString(undefined, { month: 'long' })}
			{displayed.getFullYear()}
		</div>
	</div>

	<div class="mb-2 grid grid-cols-7 text-center text-xs text-slate-600">
		{#each weekdays as wd}
			<div>{wd}</div>
		{/each}
	</div>

	<div class="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1" role="grid">
		{#each grid as cell}
			<div
				role="gridcell"
				tabindex={cell.inMonth ? 0 : -1}
				class={`flex h-auto cursor-pointer items-center justify-center rounded-xl transition duration-150 ease-out select-none ${
					cell.inMonth ? 'bg-white' : 'bg-slate-50 text-slate-400'
				} ${isTodayCell(cell) ? 'border border-blue-600 font-semibold text-blue-600' : ''} ${
					isSelectedCell(cell)
						? '-translate-y-1 border-2 border-blue-200 bg-linear-to-b from-blue-700 to-blue-800 text-white shadow-[0_8px_20px_rgba(3,102,214,0.28)]'
						: ''
				}`}
				onclick={() => {
					if (cell.inMonth) selectDay(cell.day);
				}}
				onkeydown={(e) => {
					if (cell.inMonth && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')) {
						selectDay(cell.day);
					}
				}}
				aria-selected={isSelectedCell(cell)}
				aria-current={isTodayCell(cell) ? 'date' : undefined}
				title={cell.inMonth
					? `${cell.day} ${displayed.toLocaleString(undefined, { month: 'long' })}`
					: ''}
			>
				<div class="box-border flex h-full w-full flex-col p-2">
					<div class="mb-1 font-semibold">{cell.day}</div>
					{#if cell.inMonth && tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)]}
						<div class="flex flex-wrap items-center gap-1">
							{#each tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)] as t, i}
								{#if i < 2}
									<div
										role="button"
										tabindex="0"
										class={t.type === 'event'
											? `max-w-[75%] overflow-hidden rounded-md border px-2 py-0.5 text-[11px] overflow-ellipsis whitespace-nowrap ${
													t.mandatory
														? 'border-amber-300 bg-amber-100 text-orange-800'
														: 'border-sky-200 bg-sky-100 text-sky-800'
												}`
											: 'max-w-[75%] overflow-hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] overflow-ellipsis whitespace-nowrap text-emerald-800'}
									>
										{#if t.type === 'event'}
											{t.start} {t.name}
										{:else}
											{t.text}
										{/if}
									</div>
								{/if}
							{/each}
							{#if tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)].length > 2}
								<div class="text-[11px] text-slate-500">
									+{tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)]
										.length - 2}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-2 flex items-center justify-between text-sm">
		<div class="text-xs text-slate-700">
			<div>Selected: {selected ? selected.toDateString() : '—'}</div>
			<div>Month: {displayed.getMonth() + 1}</div>
		</div>
		<div class="flex items-center gap-2">
			{#if selected && currentUser.isAdmin}
				<button
					onclick={toggleEventForm}
					aria-pressed={showEventForm}
					class="rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 text-white hover:bg-blue-800"
				>
					+ Event
				</button>
			{/if}
		</div>
	</div>

	{#if selected}
		<div class="border-t border-slate-200 bg-slate-50 p-3">
			<div class="mb-2 font-semibold">Items for {selected.toDateString()}</div>

			{#if showEventForm}
				<div class="my-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
					<input
						class="rounded-lg border border-slate-300 px-2.5 py-2"
						placeholder="Event title"
						bind:value={newEvent!.name}
					/>
					<input
						class="rounded-lg border border-slate-300 px-2.5 py-2"
						type="datetime-local"
						bind:value={newEvent!.start}
					/>
					<input
						class="rounded-lg border border-slate-300 px-2.5 py-2"
						type="datetime-local"
						bind:value={newEvent!.end}
					/>
					<input
						class="rounded-lg border border-slate-300 px-2.5 py-2"
						placeholder="Location"
						bind:value={newEvent!.location}
					/>
					<select
						class="rounded-lg border border-slate-300 px-2.5 py-2"
						bind:value={newEvent!.eventType}
					>
						<option value="OTHER">General event</option>
						<option value="MEETING">Mandatory meeting</option>
						<option value="PRACTICE">Practice session</option>
					</select>
					<label
						class="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
					>
						<input type="checkbox" bind:checked={newEvent!.mandatory} />
						<span>Track attendance for eligibility</span>
					</label>
				</div>
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						onclick={addEvent}
						disabled={eventSaving}
						class="rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 text-white disabled:opacity-60"
					>
						Save Event
					</button>
					<button
						type="button"
						onclick={() => {
							showEventForm = false;
						}}
						class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 hover:bg-slate-100"
					>
						Cancel
					</button>
				</div>
				{#if eventError}
					<div class="mt-2 text-[13px] text-red-600">{eventError}</div>
				{/if}
			{/if}

			{#if selectedItems.length}
				<ul class="space-y-2">
					{#each selectedItems as t, idx}
						<li class="rounded-xl border border-slate-200 bg-white p-3">
							{#if t.type === 'task'}
								<div class="flex items-center justify-between gap-3">
									<span class="text-slate-900">{t.text}</span>
									<button
										class="text-red-600 hover:text-red-800"
										onclick={() => removeTask(dateKey(selected), idx)}
									>
										Remove
									</button>
								</div>
							{:else}
								<button
									type="button"
									onclick={() => {
										selectedTrackedEventId = t.id;
									}}
									class={`w-full rounded-lg border px-3 py-3 text-left ${
										selectedTrackedEventId === t.id
											? 'border-blue-300 bg-blue-50'
											: 'border-slate-200 bg-white hover:bg-slate-50'
									}`}
								>
									<div class="flex flex-wrap items-center gap-2">
										<div class="font-semibold">{t.name}</div>
										<span
											class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
										>
											{formatEventType(t.eventType)}
										</span>
										{#if t.mandatory}
											<span
												class="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800"
											>
												Mandatory
											</span>
										{/if}
									</div>
									<div class="mt-1 text-[13px] text-slate-600">
										{t.start}{#if t.end}
											- {t.end}{/if}
										{#if t.location}
											at {t.location}{/if}
									</div>
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<div class="text-slate-600">No scheduled items</div>
			{/if}

			{#if eventError && !showEventForm}
				<div class="mt-3 text-sm text-red-600">{eventError}</div>
			{/if}

			{#if selectedEvent}
				<div class="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 class="text-lg font-semibold">{selectedEvent.name}</h3>
							<p class="text-sm text-slate-600">
								{formatEventType(selectedEvent.eventType)}
								{#if selectedEvent.mandatory}
									• Attendance required for eligibility tracking
								{/if}
							</p>
						</div>
						{#if currentUser.isAdmin}
							<button
								type="button"
								onclick={() => deleteEvent(selectedEvent.id)}
								disabled={eventDeleting}
								class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{eventDeleting ? 'Removing...' : 'Remove Event'}
							</button>
						{/if}
					</div>

					{#if currentUser.isAdmin && selectedEvent.mandatory && (selectedEvent.eventType === 'MEETING' || selectedEvent.eventType === 'PRACTICE')}
						<div class="mt-4">
							<div class="mb-3 flex items-center justify-between gap-3">
								<h4 class="font-semibold text-slate-900">Sponsor Attendance Tracker</h4>
								<p class="text-xs text-slate-500">
									Present: {selectedEvent.attendances.filter((entry) => entry.status === 'PRESENT')
										.length}
									· Excused: {selectedEvent.attendances.filter(
										(entry) => entry.status === 'EXCUSED'
									).length}
									· Absent: {selectedEvent.attendances.filter((entry) => entry.status === 'ABSENT')
										.length}
								</p>
							</div>

							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-slate-200 text-sm">
									<thead>
										<tr class="text-left text-slate-500">
											<th class="py-2 pr-4 font-medium">Member</th>
											<th class="py-2 pr-4 font-medium">Member ID</th>
											<th class="py-2 pr-4 font-medium">Status</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-slate-100">
										{#each attendanceRows as member}
											<tr>
												<td class="py-3 pr-4">
													<div class="font-medium text-slate-900">{member.name}</div>
													<div class="text-xs text-slate-500">{member.email}</div>
												</td>
												<td class="py-3 pr-4 text-slate-600">{member.memberId}</td>
												<td class="py-3 pr-4">
													<select
														class="rounded-lg border border-slate-300 px-3 py-2"
														value={member.status}
														disabled={attendanceSavingKey === `${selectedEvent.id}:${member.id}`}
														onchange={(event) => {
															const status = (event.currentTarget as HTMLSelectElement)
																.value as Exclude<AttendanceChoice, 'UNMARKED'>;
															updateAttendance(selectedEvent.id, member.id, status);
														}}
													>
														<option value="UNMARKED">Choose status</option>
														<option value="PRESENT">Present</option>
														<option value="EXCUSED">Excused</option>
														<option value="ABSENT">Absent</option>
													</select>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>

							{#if attendanceMessage}
								<div class="mt-3 text-sm text-emerald-700">{attendanceMessage}</div>
							{/if}
							{#if attendanceError}
								<div class="mt-3 text-sm text-red-600">{attendanceError}</div>
							{/if}
						</div>
					{:else if !currentUser.isAdmin && selectedEvent.mandatory && (selectedEvent.eventType === 'MEETING' || selectedEvent.eventType === 'PRACTICE')}
						<div
							class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
						>
							Your attendance status:
							<strong class="ml-1">
								{selectedEvent.attendances[0]?.status
									? selectedEvent.attendances[0].status.toLowerCase()
									: 'not yet recorded'}
							</strong>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
