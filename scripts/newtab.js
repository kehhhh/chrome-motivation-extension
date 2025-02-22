// Types
/** @typedef {{id: string, text: string, completed: boolean}} Todo */

// Constants
const QUOTES_API = 'https://api.quotable.io/random';
const STORAGE_KEYS = {
    NAME: 'dashboard_name',
    FOCUS: 'dashboard_focus',
    TODOS: 'dashboard_todos'
};

// DOM Elements
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const greetingElement = document.getElementById('greeting');
const nameElement = document.getElementById('name');
const quoteElement = document.getElementById('quote');
const authorElement = document.getElementById('author');
const focusElement = document.getElementById('focus');
const todoInput = document.getElementById('todoInput');
const addTodoButton = document.getElementById('addTodo');
const todoList = document.getElementById('todoList');

// State Management
/** @type {Todo[]} */
let todos = [];

// Initialize
async function initialize() {
    await Promise.all([
        loadStoredData(),
        fetchQuote(),
    ]);
    
    startTimeUpdate();
    setupEventListeners();
}

// Time and Date Functions
function startTimeUpdate() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function updateDateTime() {
    const now = new Date();
    
    // Update time
    timeElement.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    // Update date
    dateElement.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    
    // Update greeting
    const hour = now.getHours();
    let greeting = 'Good ';
    if (hour < 12) greeting += 'morning';
    else if (hour < 18) greeting += 'afternoon';
    else greeting += 'evening';
    greetingElement.textContent = greeting + '!';
}

// Quote Functions
async function fetchQuote() {
    try {
        const response = await fetch(QUOTES_API);
        const data = await response.json();
        quoteElement.textContent = data.content;
        authorElement.textContent = `- ${data.author}`;
    } catch (error) {
        console.error('Error fetching quote:', error);
        quoteElement.textContent = 'The only way to do great work is to love what you do.';
        authorElement.textContent = '- Steve Jobs';
    }
}

// Storage Functions
async function loadStoredData() {
    try {
        const [name, focus, storedTodos] = await Promise.all([
            chrome.storage.sync.get(STORAGE_KEYS.NAME),
            chrome.storage.sync.get(STORAGE_KEYS.FOCUS),
            chrome.storage.sync.get(STORAGE_KEYS.TODOS)
        ]);

        if (name[STORAGE_KEYS.NAME]) {
            nameElement.textContent = name[STORAGE_KEYS.NAME];
        }
        
        if (focus[STORAGE_KEYS.FOCUS]) {
            focusElement.textContent = focus[STORAGE_KEYS.FOCUS];
        }
        
        if (storedTodos[STORAGE_KEYS.TODOS]) {
            todos = storedTodos[STORAGE_KEYS.TODOS];
            renderTodos();
        }
    } catch (error) {
        console.error('Error loading stored data:', error);
    }
}

// Todo Functions
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const todo = {
        id: Date.now().toString(),
        text,
        completed: false
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    todoInput.value = '';
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = todo.completed ? 'completed' : '';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => toggleTodo(todo.id));
        
        const span = document.createElement('span');
        span.textContent = todo.text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style.marginLeft = 'auto';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = 'var(--text-color)';
        deleteBtn.style.fontSize = '1.5rem';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
        
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
}

async function saveTodos() {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEYS.TODOS]: todos });
    } catch (error) {
        console.error('Error saving todos:', error);
    }
}

// Event Listeners
function setupEventListeners() {
    // Name input
    nameElement.addEventListener('blur', async () => {
        const name = nameElement.textContent.trim();
        if (name && name !== 'Enter your name') {
            try {
                await chrome.storage.sync.set({ [STORAGE_KEYS.NAME]: name });
            } catch (error) {
                console.error('Error saving name:', error);
            }
        }
    });

    // Focus input
    focusElement.addEventListener('blur', async () => {
        const focus = focusElement.textContent.trim();
        if (focus && focus !== "What's your main focus for today?") {
            try {
                await chrome.storage.sync.set({ [STORAGE_KEYS.FOCUS]: focus });
            } catch (error) {
                console.error('Error saving focus:', error);
            }
        }
    });

    // Todo input
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    addTodoButton.addEventListener('click', addTodo);
}

// Start the app
initialize(); 