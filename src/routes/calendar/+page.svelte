<script lang="ts">
    // Simple month-view calendar template
    import { onMount } from 'svelte';

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let today = new Date();
    let displayed = new Date(today.getFullYear(), today.getMonth(), 1);
    let selected: Date | null = null;
    let newTaskText = '';
    // event inputs
    let newEventTitle = '';
    let newEventStart = '';
    let newEventEnd = '';
    let newEventLocation = '';
    let showEventForm = false;
    // tasks/events stored as { 'YYYY-MM-DD': [{ type:'task'|'event', text/title, createdAt, done, start, end, location }, ...] }
    let tasks: Record<string, any[]> = {};

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

    function dateKey(dateObj: Date) {
        return dateKeyFromParts(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    }

    function addTask() {
        if (!selected || !newTaskText.trim()) return;
        const key = dateKey(selected);
        tasks[key] = tasks[key] || [];
        tasks[key].push({ type: 'task', text: newTaskText.trim(), createdAt: Date.now(), done: false });
        newTaskText = '';
        // persist and trigger reactivity
        localStorage.setItem('calendar_tasks', JSON.stringify(tasks));
        tasks = { ...tasks };
    }

    function addEvent() {
        if (!selected || !newEventTitle.trim()) return;
        const key = dateKey(selected);
        tasks[key] = tasks[key] || [];
        tasks[key].push({
            type: 'event',
            title: newEventTitle.trim(),
            start: newEventStart.trim() || null,
            end: newEventEnd.trim() || null,
            location: newEventLocation.trim() || null,
            createdAt: Date.now()
        });
        newEventTitle = '';
        newEventStart = '';
        newEventEnd = '';
        newEventLocation = '';
        showEventForm = false;
        localStorage.setItem('calendar_tasks', JSON.stringify(tasks));
        tasks = { ...tasks };
    }

    function removeTask(key, idx) {
        if (!tasks[key]) return;
        tasks[key].splice(idx, 1);
        if (tasks[key].length === 0) delete tasks[key];
        localStorage.setItem('calendar_tasks', JSON.stringify(tasks));
        tasks = { ...tasks };
    }

    function toggleDone(key, idx) {
        if (!tasks[key] || !tasks[key][idx]) return;
        tasks[key][idx].done = !tasks[key][idx].done;
        localStorage.setItem('calendar_tasks', JSON.stringify(tasks));
        tasks = { ...tasks };
    }

    // build array for a 6x7 grid (weeks x weekdays)
    $: grid = (() => {
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
    })();

    function isTodayCell(cell) {
        if (!cell.inMonth) return false;
        return displayed.getFullYear() === today.getFullYear() &&
            displayed.getMonth() === today.getMonth() &&
            cell.day === today.getDate();
    }

    function isSelectedCell(cell) {
        if (!cell.inMonth || !selected) return false;
        return displayed.getFullYear() === selected.getFullYear() &&
            displayed.getMonth() === selected.getMonth() &&
            cell.day === selected.getDate();
    }

    // drag-and-drop state
    let draggedTask = null;
    let dragOverKey = null;

    function dragStart(key, idx, e) {
        // store a lightweight payload, and also put it on dataTransfer for cross-window support
        draggedTask = { key, idx, task: tasks[key][idx] };
        try {
            e.dataTransfer?.setData('text/plain', JSON.stringify({ key, idx }));
            e.dataTransfer!.effectAllowed = 'move';
        } catch (err) {
            // ignore
        }
    }

    function dragEnd(/* e */) {
        draggedTask = null;
        dragOverKey = null;
    }

    function handleDragOver(e) {
        // allow drop
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(key/*, e */) {
        dragOverKey = key;
    }

    function handleDragLeave(key/*, e */) {
        if (dragOverKey === key) dragOverKey = null;
    }

    function handleDrop(targetKey, e) {
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
        // persist and trigger reactivity
        localStorage.setItem('calendar_tasks', JSON.stringify(tasks));
        tasks = { ...tasks };
        dragEnd();
    }

    // optional: initialize selected to today
    onMount(() => {
        selected = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        try {
            const raw = localStorage.getItem('calendar_tasks');
            if (raw) {
                const parsed = JSON.parse(raw) || {};
                // migrate legacy items to include 'type'
                for (const k in parsed) {
                    parsed[k] = (parsed[k] || []).map((it) => it.type ? it : { ...it, type: 'task' });
                }
                tasks = parsed;
            }
        } catch (e) {
            tasks = {};
        }
    });
</script>

<style>
    .calendar {
        /* fill the viewport */
        width: 100vw;
        height: 100vh;
        max-width: none;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 12px;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        background: #fff;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .nav button {
        padding: 6px 10px;
        margin: 0 4px;
        border: 1px solid #ccc;
        background: #fff;
        border-radius: 4px;
        cursor: pointer;
    }
    .month {
        font-weight: 600;
    }
    .weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-size: 12px;
        color: #666;
        margin-bottom: 6px;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        /* make 6 equal-height rows that expand to fill available space */
        grid-template-rows: repeat(6, 1fr);
        gap: 6px;
        /* allow the grid to grow within the flex column layout */
        flex: 1 1 auto;
        min-height: 0;
    }
    .cell {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        cursor: pointer;
        user-select: none;
        /* allow grid rows to size the cells */
        height: auto;
        transition: background .12s ease, transform .08s ease, box-shadow .12s ease;
    }
    /* visual indicator on mouse hover */
    .cell:hover {
        background: #f5fbff;
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(2,86,179,0.06);
    }

    /* when a draggable item is over the cell */
    .cell.drag-over {
        background: linear-gradient(180deg, #e6f2ff, #dff0ff);
        border: 2px dashed rgba(3,102,214,0.45);
        transform: translateY(-2px);
    }

    .cell.out {
        color: #aaa;
        background: #fafafa;
    }

    /* show grab cursor for draggable tasks */
    .task-badge[draggable="true"], .selected-tasks li[draggable="true"] { cursor: grab }

    .cell.in {
        background: #fff;
    }
    .cell.today {
        border: 1px solid #0078d4;
        color: #0078d4;
        font-weight: 600;
    }
    .cell.selected {
        background: linear-gradient(180deg, #0366d6, #0256b3);
        color: #fff;
        box-shadow: 0 8px 20px rgba(3,102,214,0.28);
        transform: translateY(-3px);
        border-radius: 8px;
        border: 2px solid rgba(3,102,214,0.15);
    }

    /* keyboard focus + accessibility */
    .cell:focus {
        outline: 3px solid rgba(3,102,214,0.18);
        outline-offset: 2px;
    }

    /* selected-day inner emphasis */
    .cell.selected .cell-day { font-weight: 700; }
    .cell.selected .task-badge { background: rgba(255,255,255,0.12); color: #fff }
    .footer {
        margin-top: 10px;
        display:flex;
        justify-content: space-between;
        align-items:center;
        font-size: 14px;
    }
    .small {
        font-size: 13px;
        color: #444;
    }

    /* task styles */
    .cell-inner{
        width:100%;
        height:100%;
        display:flex;
        flex-direction:column;
        padding:6px;
        box-sizing:border-box;
    }
    .cell-day{ font-weight:600; margin-bottom:4px; }
    .task-preview{ display:flex; gap:4px; align-items:center; flex-wrap:wrap; }
    .task-badge{ background:#f0f4ff; color:#073; padding:2px 6px; border-radius:999px; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%; }
    .task-badge.done{ background:#eee; color:#777; text-decoration:line-through; opacity:0.7 }
    .event-badge{ background:#fff4e6; color:#a45; padding:2px 6px; border-radius:6px; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%; border:1px solid #ffe2b3; }
    .event-badge[draggable="true"] { cursor: grab }
    .task-more{ font-size:11px; color:#666 }

    .footer .task-input{ display:flex; gap:8px; align-items:center; }
    .task-input input{ padding:6px 8px; border:1px solid #ccc; border-radius:6px; }
    .task-input button{ padding:6px 10px; border-radius:6px; border:1px solid #0078d4; background:#0078d4; color:#fff; cursor:pointer }

    .selected-tasks{ padding:12px; background:#fafafa; border-top:1px solid #eee; }
    .selected-tasks-title{ font-weight:600; margin-bottom:8px }
    .selected-tasks ul{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px }
    .selected-tasks li{ display:flex; justify-content:space-between; align-items:center; background:#fff; padding:6px 8px; border-radius:6px; border:1px solid #eee }
    .selected-tasks li span.done{ text-decoration:line-through; color:#666 }
    .selected-tasks li .remove{ background:transparent; border:none; color:#c00; cursor:pointer }
    .no-tasks{ color:#666; }
</style>

<div class="calendar" role="application" aria-label="Calendar">
    <div class="header">
        <div class="nav">
            <button aria-label="Previous month" on:click={prevMonth}>&lt;</button>
            <button aria-label="Today" on:click={goToToday}>Today</button>
            <button aria-label="Next month" on:click={nextMonth}>&gt;</button>
        </div>
        <div class="month" aria-live="polite">
            {displayed.toLocaleString(undefined, { month: 'long' })} {displayed.getFullYear()}
        </div>
    </div>

    <div class="weekdays">
        {#each weekdays as wd}
            <div>{wd}</div>
        {/each}
    </div>

    <div class="grid" role="grid">
        {#each grid as cell}
            <div
                role="gridcell"
                class="cell {cell.inMonth ? 'in' : 'out'} {isTodayCell(cell) ? 'today' : ''} {isSelectedCell(cell) ? 'selected' : ''} {dragOverKey === (cell.inMonth ? dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day) : '') ? 'drag-over' : ''}"
                on:click={() => { if (cell.inMonth) selectDay(cell.day); }}
                on:dragover|preventDefault={handleDragOver}
                on:dragenter={(e) => cell.inMonth && handleDragEnter(dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day), e)}
                on:dragleave={(e) => cell.inMonth && handleDragLeave(dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day), e)}
                on:drop={(e) => cell.inMonth && handleDrop(dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day), e)}
                aria-selected={isSelectedCell(cell)}
                aria-current={isTodayCell(cell) ? 'date' : undefined}
                title={cell.inMonth ? `${cell.day} ${displayed.toLocaleString(undefined,{month:'long'})}` : ''}
            >
                <div class="cell-inner">
                    <div class="cell-day">{cell.day}</div>
                    {#if cell.inMonth}
                        {#if tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)]}
                            <div class="task-preview">
                                {#each tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)] as t, i}
                                    {#if i < 2}
                                        <div class={t.type === 'event' ? 'event-badge' : 'task-badge'} title={t.type === 'event' ? `${t.title}${t.start ? ' • '+t.start+(t.end? ' - '+t.end:'') : ''}${t.location? ' @ '+t.location: ''}` : t.text} class:done={t.done} draggable="true" on:dragstart={(e) => dragStart(dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day), i, e)} on:dragend={dragEnd}>
                                            {t.type === 'event' ? (t.start ? t.start + ' ' : '') + t.title : t.text}
                                        </div>
                                    {/if}
                                {/each}
                                {#if tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)].length > 2}
                                    <div class="task-more">+{tasks[dateKeyFromParts(displayed.getFullYear(), displayed.getMonth(), cell.day)].length - 2}</div>
                                {/if}
                            </div>
                        {/if}
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <div class="footer">
        <div class="small selected-info">
            <div>Selected: {selected ? selected.toDateString() : '—'}</div>
            <div>Month: {displayed.getMonth() + 1}</div>
        </div>
        <div class="task-input">
            {#if selected}
                <input placeholder="Add task..." bind:value={newTaskText} on:keydown={(e)=> e.key==='Enter' && addTask()} />
                <button on:click={addTask}>Add</button>
                <button on:click={() => showEventForm = !showEventForm} aria-pressed={showEventForm} style="margin-left:6px">+ Event</button>
            {/if}
        </div>
    </div>

    {#if selected}
        <div class="selected-tasks">
            <div class="selected-tasks-title">Items for {selected.toDateString()}</div>
            {#if showEventForm}
                <div style="display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap">
                    <input placeholder="Event title" bind:value={newEventTitle} />
                    <input type="time" bind:value={newEventStart} />
                    <input type="time" bind:value={newEventEnd} />
                    <input placeholder="Location" bind:value={newEventLocation} />
                    <button on:click={addEvent}>Add Event</button>
                    <button on:click={() => { showEventForm = false; }}>Cancel</button>
                </div>
            {/if}
            {#if tasks[dateKey(selected)]}
                <ul>
                    {#each tasks[dateKey(selected)] as t, idx}
                            <li draggable="true" on:dragstart={(e) => dragStart(dateKey(selected), idx, e)} on:dragend={dragEnd}>
                                {#if t.type === 'task'}
                                    <label style="display:flex;align-items:center;gap:8px;flex:1">
                                        <input type="checkbox" checked={t.done} on:change={() => toggleDone(dateKey(selected), idx)} />
                                        <span class:done={t.done}>{t.text}</span>
                                    </label>
                                {:else if t.type === 'event'}
                                    <div style="display:flex;flex-direction:column;gap:4px;flex:1">
                                        <div style="font-weight:600">{t.title} {#if t.start}<span style="font-weight:400;color:#666;font-size:13px"> — {t.start}{#if t.end}–{t.end}{/if}</span>{/if}</div>
                                        {#if t.location}<div style="font-size:13px;color:#555">{t.location}</div>{/if}
                                    </div>
                                {/if}
                                <button class="remove" on:click={() => removeTask(dateKey(selected), idx)}>✕</button>
                            </li>
                        {/each}
                </ul>
            {:else}
                <div class="no-tasks">No tasks</div>
            {/if}
        </div>
    {/if}
</div>