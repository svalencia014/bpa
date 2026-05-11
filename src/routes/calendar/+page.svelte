<script lang="ts">
    // Simple month-view calendar template
    import { page } from "$app/state";
    import { onMount } from 'svelte';
	import type { Event } from "../../../generated/prisma/client";

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
        createdAt: Date;
    };

    type CalendarEventItem = {
        type: 'event';
        id: string;
        name: string;
        start: string;
        end: string;
        location: string;
        createdAt: Date;
    };

    type CalendarItem = CalendarTask | CalendarEventItem;

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const events: Event[] = $state(page.data.events);

    let today = $state(new Date());
    let displayed = $state(new Date());
    let selected = $state<Date | null>(null);
    let newTaskText = $state('');
    // event inputs
    let newEvent: CalendarEventForm | undefined = $state(undefined);
    let showEventForm = $state(false);
    let eventError = $state('');
    let eventSaving = $state(false);
    // tasks/events stored as { 'YYYY-MM-DD': [{ type:'task'|'event', text, createdAt, done, start, end, location }, ...] }
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
        const value = toDatetimeLocalValue(baseDate);
        return { type: 'event', name: '', start: value, end: value, location: '', createdAt: new Date() };
    }

    function formatEventTime(value: Date): string {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value.toString();
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    function mapDbEvent(event: Event): CalendarEventItem {
        return {
            type: 'event',
            id: event.id,
            name: event.name,
            start: formatEventTime(event.dateStart),
            end: formatEventTime(event.dateEnd),
            location: event.location ?? '',
            createdAt: event.createdAt,
        };
    }

    function isTaskItem(item: CalendarItem): item is CalendarTask {
        return item.type === 'task';
    }

    function addTask() {
        if (!selected || !newTaskText.trim()) return;
        const key = dateKey(selected);
        tasks[key] = tasks[key] || [];
        tasks[key].push({ type: 'task', text: newTaskText.trim(), createdAt: Date.now(), done: false });
        newTaskText = '';
        tasks = { ...tasks };
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
        };

        try {
            const response = await fetch('/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                eventError = errorText || 'Could not save event.';
                return;
            }

            const createdEvent = await response.json();
            const key = dateKey(new Date(createdEvent.dateStart));
            if (key) {
                tasks[key] = tasks[key] || [];
                tasks[key].push(mapDbEvent(createdEvent));
                tasks = { ...tasks };
            }

            showEventForm = false;
            newEvent = getDefaultEvent(selected ?? today);
        } catch (error) {
            eventError = 'Unable to save event.';
            console.error('Event save failed:', error);
        } finally {
            eventSaving = false;
        }
    }

    function toggleEventForm() {
        if (!newEvent) newEvent = getDefaultEvent(selected ?? today);
        showEventForm = !showEventForm;
    }

    function removeTask(key: string, idx: number) {
        if (!tasks[key]) return;
        tasks[key].splice(idx, 1);
        if (tasks[key].length === 0) delete tasks[key];

        tasks = { ...tasks };
    }

    function toggleDone(key: string, idx: number) {
        if (!tasks[key] || !tasks[key][idx]) return;
        const item = tasks[key][idx];
        if (!isTaskItem(item)) return;
        item.done = !item.done;
        tasks = { ...tasks };
    }

    // build array for a 6x7 grid (weeks x weekdays)
    const grid = $derived.by(() => {
        const year = displayed.getFullYear();
        const month = displayed.getMonth();
        const firstDow = new Date(year, month, 1).getDay(); // 0..6
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevDays = new Date(year, month, 0).getDate(); // days in previous month

        const cells = [];
        // previous month's tail
        for (let i = firstDow - 1; i >= 0; i--) {
            cells.push({ day: prevDays - i, inMonth: false });
        }
        // current month
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ day: d, inMonth: true });
        }
        // next month's head to fill 42 cells
        while (cells.length < 42) {
            cells.push({ day: cells.length - (firstDow + daysInMonth) + 1, inMonth: false });
        }
        return cells;
    });

    function isTodayCell(cell: { day: number; inMonth: boolean }) {
        if (!cell.inMonth) return false;
        return displayed.getFullYear() === today.getFullYear() &&
            displayed.getMonth() === today.getMonth() &&
            cell.day === today.getDate();
    }

    function isSelectedCell(cell: { day: number; inMonth: boolean }) {
        if (!cell.inMonth || !selected) return false;
        return displayed.getFullYear() === selected.getFullYear() &&
            displayed.getMonth() === selected.getMonth() &&
            cell.day === selected.getDate();
    }

    // drag-and-drop state
    let draggedTask = $state<{ key: string; idx: number; task: any } | null>(null);
    let dragOverKey = $state<string | null>(null);

    function dragStart(key: string, idx: number, e: DragEvent) {
        // store a lightweight payload, and also put it on dataTransfer for cross-window support
        draggedTask = { key, idx, task: tasks[key][idx] };
        try {
            e.dataTransfer?.setData('text/plain', JSON.stringify({ key, idx }));
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        } catch (err) {
            // ignore
        }
    }

    function dragEnd(/* e */) {
        draggedTask = null;
        dragOverKey = null;
    }

    function handleDragOver(e: DragEvent) {
        // allow drop
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(key: string, e?: DragEvent) {
        dragOverKey = key;
    }

    function handleDragLeave(key: string, e?: DragEvent) {
        if (dragOverKey === key) dragOverKey = null;
    }

    function handleDrop(targetKey: string, e: DragEvent) {
        e.preventDefault();
        let payload = null;
        try {
            const dt = e.dataTransfer?.getData('text/plain');
            if (dt) payload = JSON.parse(dt);
        } catch (err) {}
        const source = payload || draggedTask;
        if (!source) return;
        const { key: srcKey, idx } = source;
        const srcList = tasks[srcKey];
        if (!srcList || !srcList[idx]) return;
        const item = srcList[idx];
        if (srcKey === targetKey) {
            dragEnd();
            return;
        }
        // remove from source
        srcList.splice(idx, 1);
        if (srcList.length === 0) delete tasks[srcKey];
        // add to target
        tasks[targetKey] = tasks[targetKey] || [];
        tasks[targetKey].push(item);
        tasks = { ...tasks };
        dragEnd();
    }

    // optional: initialize selected and displayed to today
    onMount(() => {
        selected = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        displayed = new Date(today.getFullYear(), today.getMonth(), 1);

        for (const event of events) {
            const eventDate = new Date(event.dateStart);
            const key = dateKey(eventDate);
            if (!key) continue;
            tasks[key] = tasks[key] || [];
            tasks[key].push(mapDbEvent(event));
        }
    });
</script>



<div class="w-screen h-screen max-w-none box-border flex flex-col border border-slate-300 rounded-xl p-3 font-sans bg-white" role="application" aria-label="Calendar">
    <div class="flex items-center justify-between mb-3">
        <div class="flex items-center">
            <button aria-label="Previous month" onclick={prevMonth} class="px-3 py-2 mx-1 border border-slate-300 bg-white rounded-md hover:bg-slate-50">&lt;</button>
            <button aria-label="Today" onclick={goToToday} class="px-3 py-2 mx-1 border border-slate-300 bg-white rounded-md hover:bg-slate-50">Today</button>
            <button aria-label="Next month" onclick={nextMonth} class="px-3 py-2 mx-1 border border-slate-300 bg-white rounded-md hover:bg-slate-50">&gt;</button>
        </div>
        <div class="font-semibold" aria-live="polite">
            {displayed.toLocaleString(undefined, { month: 'long' })} {displayed.getFullYear()}
        </div>
    </div>

    <div class="grid grid-cols-7 text-center text-xs text-slate-600 mb-2">
        {#each weekdays as wd}
            <div>{wd}</div>
        {/each}
    </div>

    <div class="grid grid-cols-7 grid-rows-6 gap-1 flex-1 min-h-0" role="grid">
        {#each grid as cell}
            <div
                role="gridcell"
                tabindex={cell.inMonth ? 0 : -1}
                class={
                    `flex items-center justify-center rounded-xl cursor-pointer select-none h-auto transition duration-150 ease-out ${cell.inMonth ? 'bg-white' : 'text-slate-400 bg-slate-50'} ` +
                    `${isTodayCell(cell) ? 'border border-blue-600 text-blue-600 font-semibold' : ''} ` +
                    `${isSelectedCell(cell) ? 'bg-linear-to-b from-blue-700 to-blue-800 text-white shadow-[0_8px_20px_rgba(3,102,214,0.28)] -translate-y-1 border-2 border-blue-200' : ''} ` +
                    `${dragOverKey === (cell.inMonth ? dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day) : '') ? 'bg-linear-to-b from-slate-100 to-slate-50 border-2 border-dashed border-blue-300' : ''}`
                }
                onclick={() => { if (cell.inMonth) selectDay(cell.day); }}
                onkeydown={(e) => { if (cell.inMonth && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')) selectDay(cell.day); }}
                ondragover={handleDragOver}
                ondragenter={(e) => cell.inMonth && handleDragEnter(dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day), e)}
                ondragleave={(e) => cell.inMonth && handleDragLeave(dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day), e)}
                ondrop={(e) => cell.inMonth && handleDrop(dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day), e)}
                aria-selected={isSelectedCell(cell)}
                aria-current={isTodayCell(cell) ? 'date' : undefined}
                title={cell.inMonth ? `${cell.day} ${displayed.toLocaleString(undefined,{month:'long'})}` : ''}
            >
                <div class="w-full h-full flex flex-col p-2 box-border">
                    <div class="font-semibold mb-1">{cell.day}</div>
                    {#if cell.inMonth}
                        {#if tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)]}
                            <div class="flex gap-1 items-center flex-wrap">
                                {#each tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)] as t, i}
                                    {#if i < 2}
                                        <div role="button" tabindex="0" class={t.type === 'event' ? 'bg-amber-100 text-orange-700 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap overflow-hidden overflow-ellipsis max-w-[70%]' : 'bg-slate-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap overflow-hidden overflow-ellipsis max-w-[70%]'} class:line-through={t.type === 'task' && t.done} class:text-slate-600={t.type === 'task' && t.done} class:opacity-70={t.type === 'task' && t.done} draggable="true" ondragstart={(e) => dragStart(dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day), i, e)} ondragend={dragEnd}>
                                            {t.type === 'event' ? (t.start ? t.start + ' ' : '') + t.name : t.text}
                                        </div>
                                    {/if}
                                {/each}
                                {#if tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)].length > 2}
                                    <div class="text-[11px] text-slate-500">+{tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)].length - 2}</div>
                                {/if}
                            </div>
                        {/if}
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <div class="mt-2 flex justify-between items-center text-sm">
        <div class="text-xs text-slate-700">
            <div>Selected: {selected ? selected.toDateString() : '—'}</div>
            <div>Month: {displayed.getMonth() + 1}</div>
        </div>
        <div class="flex gap-2 items-center">
            {#if selected}
                <button onclick={toggleEventForm} aria-pressed={showEventForm} class="px-3 py-2 rounded-lg border border-blue-700 bg-blue-700 text-white hover:bg-blue-800">+ Event</button>
            {/if}
        </div>
    </div>

    {#if selected}
        <div class="p-3 bg-slate-50 border-t border-slate-200">
            <div class="font-semibold mb-2">Items for {selected.toDateString()}</div>
            {#if showEventForm}
                <div class="flex flex-wrap gap-2 items-center my-2">
                    <input class="px-2.5 py-2 border border-slate-300 rounded-lg" placeholder="Event title" bind:value={newEvent!.name} />
                    <input class="px-2.5 py-2 border border-slate-300 rounded-lg" type="datetime-local" bind:value={newEvent!.start} />
                    <input class="px-2.5 py-2 border border-slate-300 rounded-lg" type="datetime-local" bind:value={newEvent!.end} />
                    <input class="px-2.5 py-2 border border-slate-300 rounded-lg" placeholder="Location" bind:value={newEvent!.location} />
                    <button type="button" onclick={addEvent} disabled={eventSaving} class="px-3 py-2 rounded-lg border border-blue-700 bg-blue-700 text-white disabled:opacity-60">Add Event</button>
                    <button type="button" onclick={() => { showEventForm = false; }} class="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">Cancel</button>
                </div>
                {#if eventError}
                    <div class="mt-1 text-[13px] text-red-600">{eventError}</div>
                {/if}
            {/if}
            {#if tasks[dateKey(selected)]}
                <ul class="space-y-2">
                    {#each tasks[dateKey(selected)] as t, idx}
                            <li draggable="true" class="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200" ondragstart={(e) => dragStart(dateKey(selected), idx, e)} ondragend={dragEnd}>
                                {#if t.type === 'task'}
                                    <label class="flex items-center gap-2 flex-1">
                                        <input type="checkbox" checked={t.done} onchange={() => toggleDone(dateKey(selected), idx)} />
                                        <span class="text-slate-900" class:line-through={t.done} class:text-slate-600={t.done}>{t.text}</span>
                                    </label>
                                {:else if t.type === 'event'}
                                    <div class="flex flex-col gap-1 flex-1">
                                        <div class="font-semibold">{t.name} {#if t.start}<span class="font-normal text-slate-500 text-[13px]"> — {t.start}{#if t.end}–{t.end}{/if}</span>{/if}</div>
                                        {#if t.location}<div class="text-slate-600 text-[13px]">{t.location}</div>{/if}
                                    </div>
                                {/if}
                                <button class="text-red-600 hover:text-red-800" onclick={() => removeTask(dateKey(selected), idx)}>✕</button>
                            </li>
                        {/each}
                </ul>
            {:else}
                <div class="text-slate-600">No tasks</div>
            {/if}
        </div>
    {/if}
</div>