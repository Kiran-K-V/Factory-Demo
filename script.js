document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const taskCount = document.getElementById('task-count');
    const emptyState = document.getElementById('empty-state');
    const filterItems = document.querySelectorAll('.filter-item');

    const MODES = ['todo', 'in-progress', 'done'];
    const MODE_LABELS = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'done': 'Done'
    };

    let currentFilter = 'all';

    addBtn.addEventListener('click', addTask);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    filterItems.forEach((item) => {
        item.addEventListener('click', () => {
            filterItems.forEach((f) => f.classList.remove('active'));
            item.classList.add('active');
            currentFilter = item.getAttribute('data-filter');
            applyFilter();
        });
    });

    function getTasks() {
        return Array.from(todoList.querySelectorAll('li:not(#empty-state)'));
    }

    function updateCount() {
        const tasks = getTasks();
        const total = tasks.length;
        const counts = { all: total, 'todo': 0, 'in-progress': 0, 'done': 0 };
        tasks.forEach((li) => {
            const mode = li.getAttribute('data-mode') || 'todo';
            counts[mode] = (counts[mode] || 0) + 1;
        });

        document.querySelectorAll('.filter-count').forEach((el) => {
            const key = el.getAttribute('data-count');
            el.textContent = counts[key] || 0;
        });

        const visibleTasks = tasks.filter((li) => !li.classList.contains('hidden'));
        emptyState.style.display = visibleTasks.length === 0 ? 'block' : 'none';
        if (visibleTasks.length === 0 && total > 0) {
            emptyState.querySelector('.empty-text') &&
                (emptyState.querySelector('.empty-text').textContent = 'No tasks in this view.');
        }
        taskCount.textContent = total > 0
            ? `${counts['done']} of ${total} completed`
            : '';
    }

    function applyFilter() {
        const tasks = getTasks();
        tasks.forEach((li) => {
            const mode = li.getAttribute('data-mode') || 'todo';
            if (currentFilter === 'all' || currentFilter === mode) {
                li.classList.remove('hidden');
            } else {
                li.classList.add('hidden');
            }
        });
        updateCount();
    }

    function cycleMode(li) {
        const current = li.getAttribute('data-mode') || 'todo';
        const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
        setMode(li, next);
    }

    function setMode(li, mode) {
        li.setAttribute('data-mode', mode);
        li.classList.toggle('completed', mode === 'done');
        const badge = li.querySelector('.mode-badge');
        if (badge) {
            badge.textContent = MODE_LABELS[mode];
            badge.className = `mode-badge mode-${mode}`;
        }
        applyFilter();
    }

    function addTask() {
        const taskText = todoInput.value.trim();
        if (taskText === '') return;

        const li = document.createElement('li');
        li.setAttribute('data-mode', 'todo');

        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = taskText;

        const badge = document.createElement('button');
        badge.className = 'mode-badge mode-todo';
        badge.textContent = MODE_LABELS['todo'];
        badge.title = 'Click to change status';
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleMode(li);
        });

        const select = document.createElement('select');
        select.className = 'mode-select';
        MODES.forEach((m) => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = MODE_LABELS[m];
            select.appendChild(opt);
        });
        select.value = 'todo';
        select.addEventListener('change', (e) => {
            e.stopPropagation();
            setMode(li, select.value);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            li.remove();
            applyFilter();
        });

        const actions = document.createElement('div');
        actions.className = 'task-actions';
        actions.appendChild(badge);
        actions.appendChild(select);
        actions.appendChild(deleteBtn);

        li.appendChild(span);
        li.appendChild(actions);
        todoList.appendChild(li);

        todoInput.value = '';
        applyFilter();
    }

    updateCount();
});
