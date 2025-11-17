// Task Manager App - Minimal implementation
class TaskManager {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.categories = JSON.parse(localStorage.getItem('categories')) || ['Work', 'Personal'];
    this.currentUser = localStorage.getItem('currentUser') || null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadCategories();
    this.renderTasks();
    this.updateTaskCount();
    
    if (this.currentUser) {
      this.showApp();
    } else {
      this.showAuth();
    }
  }

  setupEventListeners() {
    // Auth
    document.getElementById('auth-form').addEventListener('submit', (e) => this.handleAuth(e));
    document.getElementById('show-signup').addEventListener('click', (e) => this.toggleAuthMode(e));
    document.getElementById('sign-out-btn').addEventListener('click', () => this.signOut());

    // Tasks
    document.getElementById('task-form').addEventListener('submit', (e) => this.addTask(e));
    document.getElementById('search-input').addEventListener('input', (e) => this.searchTasks(e.target.value));

    // Categories
    document.getElementById('add-category-btn').addEventListener('click', () => this.addCategory());

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.filterTasks(e.target.dataset.filter));
    });

    // Modals
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
    });

    // Header buttons
    document.getElementById('stats-btn').addEventListener('click', () => this.showStats());
    document.getElementById('export-btn').addEventListener('click', () => this.exportTasks());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }
    });
  }

  handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    
    if (username && password) {
      this.currentUser = username;
      localStorage.setItem('currentUser', username);
      this.showApp();
    }
  }

  toggleAuthMode(e) {
    e.preventDefault();
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-submit-btn');
    const link = document.getElementById('show-signup');
    
    if (title.textContent === 'Sign In') {
      title.textContent = 'Sign Up';
      btn.textContent = 'Sign Up';
      link.innerHTML = 'Already have an account? <a href="#">Sign In</a>';
    } else {
      title.textContent = 'Sign In';
      btn.textContent = 'Sign In';
      link.innerHTML = 'Don\'t have an account? <a href="#">Sign Up</a>';
    }
  }

  showAuth() {
    document.getElementById('auth-modal').hidden = false;
    document.getElementById('app').hidden = true;
  }

  showApp() {
    document.getElementById('auth-modal').hidden = true;
    document.getElementById('app').hidden = false;
    document.getElementById('current-user-display').textContent = this.currentUser;
  }

  signOut() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.showAuth();
  }

  addTask(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const task = {
      id: Date.now(),
      text: formData.get('task'),
      notes: formData.get('notes'),
      dueDate: formData.get('dueDate'),
      category: formData.get('category'),
      priority: formData.get('priority'),
      recurrence: formData.get('recurrence'),
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.renderTasks();
    this.updateTaskCount();
    e.target.reset();
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateTaskCount();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
    this.renderTasks();
    this.updateTaskCount();
  }

  addCategory() {
    const input = document.getElementById('category-input');
    const category = input.value.trim();
    
    if (category && !this.categories.includes(category)) {
      this.categories.push(category);
      localStorage.setItem('categories', JSON.stringify(this.categories));
      this.loadCategories();
      input.value = '';
    }
  }

  loadCategories() {
    const selects = [document.getElementById('task-category'), document.getElementById('edit-task-category')];
    
    selects.forEach(select => {
      if (select) {
        select.innerHTML = '<option value="">No Category</option>';
        this.categories.forEach(cat => {
          select.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
      }
    });
  }

  searchTasks(query) {
    const filtered = this.tasks.filter(task => 
      task.text.toLowerCase().includes(query.toLowerCase()) ||
      task.notes.toLowerCase().includes(query.toLowerCase())
    );
    this.renderTasks(filtered);
  }

  filterTasks(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

    let filtered = this.tasks;
    if (filter === 'active') filtered = this.tasks.filter(t => !t.completed);
    if (filter === 'completed') filtered = this.tasks.filter(t => t.completed);

    this.renderTasks(filtered);
  }

  renderTasks(tasksToRender = this.tasks) {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    tasksToRender.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''} 
               onchange="app.toggleTask(${task.id})">
        <div class="task-content">
          <div class="task-text">${task.text}</div>
          <div class="task-meta">
            ${task.category ? `<span>📁 ${task.category}</span>` : ''}
            ${task.dueDate ? `<span>📅 ${task.dueDate}</span>` : ''}
            <span class="priority-${task.priority}">🔥 ${task.priority}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-danger" onclick="app.deleteTask(${task.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      list.appendChild(li);
    });
  }

  updateTaskCount() {
    const activeCount = this.tasks.filter(t => !t.completed).length;
    document.getElementById('task-count').textContent = `${activeCount} tasks left`;
  }

  showStats() {
    document.getElementById('dashboard-modal').hidden = false;
    this.renderChart();
  }

  renderChart() {
    const ctx = document.getElementById('stats-chart').getContext('2d');
    const completed = this.tasks.filter(t => t.completed).length;
    const active = this.tasks.filter(t => !t.completed).length;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Active'],
        datasets: [{
          data: [completed, active],
          backgroundColor: ['#27ae60', '#e74c3c']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: 'white' }
          }
        }
      }
    });
  }

  exportTasks() {
    const data = JSON.stringify(this.tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  closeModal(modal) {
    modal.hidden = true;
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }
}

// Initialize app
const app = new TaskManager();

// Background video controls (simplified)
const backgrounds = ['Abstract', 'Nature', 'City'];
let currentBg = 0;

document.getElementById('bg-next-btn').addEventListener('click', () => {
  currentBg = (currentBg + 1) % backgrounds.length;
  document.getElementById('bg-title').textContent = backgrounds[currentBg];
});

document.getElementById('bg-prev-btn').addEventListener('click', () => {
  currentBg = (currentBg - 1 + backgrounds.length) % backgrounds.length;
  document.getElementById('bg-title').textContent = backgrounds[currentBg];
});