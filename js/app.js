/* ============================================================
   PERSONAL DASHBOARD — app.js
   Vanilla JavaScript · LocalStorage · No frameworks
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────
   SECTION 1 · GREETING & CLOCK
   ────────────────────────────────────────── */

const greetingText  = document.getElementById('greeting-text');
const timeDisplay   = document.getElementById('time-display');
const dateDisplay   = document.getElementById('date-display');
const customNameInput = document.getElementById('custom-name-input');
const saveNameBtn   = document.getElementById('save-name-btn');

/** Returns greeting based on current hour */
function getGreeting(hour) {
  if (hour >= 5 && hour < 12)  return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

/** Formats a date as "Friday, November 6, 2026" */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Formats time as "08:05:23" */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function updateClock() {
  const now  = new Date();
  const name = localStorage.getItem('userName') || '';
  const greeting = getGreeting(now.getHours());

  greetingText.textContent = name
    ? `${greeting}, ${name}! 👋`
    : `${greeting}! 👋`;

  timeDisplay.textContent = formatTime(now);
  dateDisplay.textContent = formatDate(now);
}

// Initialise name input from storage
customNameInput.value = localStorage.getItem('userName') || '';

saveNameBtn.addEventListener('click', () => {
  const name = customNameInput.value.trim();
  if (name) {
    localStorage.setItem('userName', name);
  } else {
    localStorage.removeItem('userName');
  }
  updateClock();
});

// Allow saving with Enter key
customNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveNameBtn.click();
});

// Run immediately and then every second
updateClock();
setInterval(updateClock, 1000);


/* ──────────────────────────────────────────
   SECTION 2 · DARK / LIGHT THEME
   ────────────────────────────────────────── */

const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

// Load saved theme or default to light
applyTheme(localStorage.getItem('theme') || 'light');

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
});


/* ──────────────────────────────────────────
   SECTION 3 · FOCUS TIMER (POMODORO)
   ────────────────────────────────────────── */

const timerDisplay    = document.getElementById('timer-display');
const timerStatus     = document.getElementById('timer-status');
const startBtn        = document.getElementById('timer-start');
const stopBtn         = document.getElementById('timer-stop');
const resetBtn        = document.getElementById('timer-reset');
const durationInput   = document.getElementById('pomodoro-duration');
const applyDurationBtn = document.getElementById('apply-duration-btn');

// Load saved duration or default to 25 min
let pomodoroMinutes = parseInt(localStorage.getItem('pomodoroDuration'), 10) || 25;
durationInput.value = pomodoroMinutes;

let totalSeconds  = pomodoroMinutes * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;
let isRunning     = false;

/** Pads a number to 2 digits */
function pad(n) { return String(n).padStart(2, '0'); }

function renderTimer() {
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  timerDisplay.textContent = `${pad(m)}:${pad(s)}`;
}

function setTimerState(state) {
  // state: 'idle' | 'running' | 'finished'
  timerDisplay.classList.remove('running', 'finished');
  if (state === 'running') {
    timerDisplay.classList.add('running');
    timerStatus.textContent = 'Focus! 🎯';
    startBtn.disabled = true;
    stopBtn.disabled  = false;
  } else if (state === 'finished') {
    timerDisplay.classList.add('finished');
    timerStatus.textContent = '✅ Session complete! Take a break.';
    startBtn.disabled = false;
    stopBtn.disabled  = true;
  } else {
    timerStatus.textContent = 'Ready';
    startBtn.disabled = false;
    stopBtn.disabled  = true;
  }
}

function startTimer() {
  if (isRunning) return;
  if (remainingSeconds <= 0) remainingSeconds = totalSeconds;
  isRunning = true;
  setTimerState('running');

  timerInterval = setInterval(() => {
    remainingSeconds--;
    renderTimer();

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      setTimerState('finished');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  setTimerState('idle');
  timerStatus.textContent = 'Paused';
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  remainingSeconds = totalSeconds;
  renderTimer();
  setTimerState('idle');
}

function applyDuration() {
  const val = parseInt(durationInput.value, 10);
  if (isNaN(val) || val < 1 || val > 120) {
    durationInput.focus();
    return;
  }
  pomodoroMinutes = val;
  localStorage.setItem('pomodoroDuration', val);
  totalSeconds = val * 60;
  resetTimer();
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click',  stopTimer);
resetBtn.addEventListener('click', resetTimer);
applyDurationBtn.addEventListener('click', applyDuration);
durationInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyDuration();
});

// Initial render
renderTimer();
setTimerState('idle');


/* ──────────────────────────────────────────
   SECTION 4 · TO-DO LIST
   ────────────────────────────────────────── */

const todoForm    = document.getElementById('todo-form');
const todoInput   = document.getElementById('todo-input');
const todoList    = document.getElementById('todo-list');
const todoEmpty   = document.getElementById('todo-empty');
const sortSelect  = document.getElementById('sort-select');
const editModal   = document.getElementById('edit-modal');
const editTaskInput  = document.getElementById('edit-task-input');
const editSaveBtn    = document.getElementById('edit-save-btn');
const editCancelBtn  = document.getElementById('edit-cancel-btn');

let tasks      = [];
let editingId  = null;

/* ── Storage ── */
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  } catch {
    tasks = [];
  }
}

/* ── Sorting ── */
function getSortedTasks() {
  const copy = [...tasks];
  const mode = sortSelect.value;
  if (mode === 'az')    return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (mode === 'za')    return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (mode === 'done')  return copy.sort((a, b) => Number(a.done) - Number(b.done));
  if (mode === 'undone') return copy.sort((a, b) => Number(b.done) - Number(a.done));
  return copy; // default: insertion order
}

/* ── Render ── */
function renderTasks() {
  todoList.innerHTML = '';
  const sorted = getSortedTasks();

  todoEmpty.hidden = sorted.length > 0;

  sorted.forEach((task) => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as done`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    todoList.appendChild(li);
  });
}

/* ── CRUD ── */
function addTask(text) {
  tasks.push({ id: Date.now(), text: text.trim(), done: false });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;
  editTaskInput.value = task.text;
  editModal.hidden = false;
  editTaskInput.focus();
}

function closeEditModal() {
  editModal.hidden = true;
  editingId = null;
}

function saveEditedTask() {
  const newText = editTaskInput.value.trim();
  if (!newText || editingId === null) return;
  tasks = tasks.map(t => t.id === editingId ? { ...t, text: newText } : t);
  saveTasks();
  renderTasks();
  closeEditModal();
}

/* ── Events ── */
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    addTask(text);
    todoInput.value = '';
    todoInput.focus();
  }
});

sortSelect.addEventListener('change', renderTasks);

editSaveBtn.addEventListener('click', saveEditedTask);
editCancelBtn.addEventListener('click', closeEditModal);
editTaskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveEditedTask();
  if (e.key === 'Escape') closeEditModal();
});

// Close modal on backdrop click
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

// Initial load
loadTasks();
renderTasks();


/* ──────────────────────────────────────────
   SECTION 5 · QUICK LINKS
   ────────────────────────────────────────── */

const linkForm      = document.getElementById('link-form');
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linksGrid     = document.getElementById('links-grid');
const linksEmpty    = document.getElementById('links-empty');

let links = [];

/* ── Storage ── */
function saveLinks() {
  localStorage.setItem('quickLinks', JSON.stringify(links));
}

function loadLinks() {
  try {
    links = JSON.parse(localStorage.getItem('quickLinks')) || [];
  } catch {
    links = [];
  }
}

/* ── Favicon helper ── */
function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return null;
  }
}

/* ── Render ── */
function renderLinks() {
  linksGrid.innerHTML = '';
  linksEmpty.hidden = links.length > 0;

  links.forEach((link) => {
    const item = document.createElement('div');
    item.className = 'link-item';

    const a = document.createElement('a');
    a.href = link.url;
    a.className = 'link-btn';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `Open ${link.name}`);

    // Favicon
    const faviconSrc = getFaviconUrl(link.url);
    if (faviconSrc) {
      const img = document.createElement('img');
      img.src = faviconSrc;
      img.className = 'link-favicon';
      img.alt = '';
      img.onerror = () => img.remove(); // hide if favicon fails to load
      a.appendChild(img);
    }

    const label = document.createElement('span');
    label.textContent = link.name;
    a.appendChild(label);

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Remove ${link.name}`);
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    item.appendChild(a);
    item.appendChild(delBtn);
    linksGrid.appendChild(item);
  });
}

/* ── CRUD ── */
function addLink(name, url) {
  // Prepend https:// if no protocol provided
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ id: Date.now(), name: name.trim(), url: url.trim() });
  saveLinks();
  renderLinks();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

/* ── Events ── */
linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();
  if (name && url) {
    addLink(name, url);
    linkNameInput.value = '';
    linkUrlInput.value  = '';
    linkNameInput.focus();
  }
});

// Initial load
loadLinks();
renderLinks();
