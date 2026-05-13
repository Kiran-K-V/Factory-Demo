document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const taskCount = document.getElementById('task-count');
    const emptyState = document.getElementById('empty-state');

    addBtn.addEventListener('click', addTask);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    function updateCount() {
        const items = todoList.querySelectorAll('li:not(#empty-state)');
        const completed = todoList.querySelectorAll('li.completed').length;
        const total = items.length;
        emptyState.style.display = total === 0 ? 'block' : 'none';
        taskCount.textContent = total > 0 ? `${completed} of ${total} completed` : '';
    }

    function addTask() {
        const taskText = todoInput.value.trim();
        if (taskText === '') return;

        const li = document.createElement('li');

        const span = document.createElement('span');
        span.textContent = taskText;
        span.addEventListener('click', () => {
            li.classList.toggle('completed');
            updateCount();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => {
            li.remove();
            updateCount();
        });

        li.appendChild(span);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);

        todoInput.value = '';
        updateCount();
    }

    updateCount();
});
