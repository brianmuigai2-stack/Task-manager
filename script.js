// script.js
document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------
    // ELEMENTS & AUTH STATE
    // ----------------------------
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const showSignupAnchor = document.getElementById('show-signup'); // anchor in your HTML
    const appContainer = document.getElementById('app');
    const signOutBtn = document.getElementById('sign-out-btn');
    const currentUserDisplay = document.getElementById('current-user-display');
  
    let isSigningUp = false;
    let currentUser = localStorage.getItem('currentUser') || null;
  
    // ----------------------------
    // USER NORMALIZATION + MIGRATION
    // ----------------------------
    const normalizeUsername = (raw) => (raw || '').toString().trim().toLowerCase();
  
    // Migrate existing users keyed by raw username to normalized keys (non-destructive).
    const migrateUsersToNormalized = () => {
      try {
        const rawUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const normalized = {};
        Object.entries(rawUsers).forEach(([key, value]) => {
          const k = normalizeUsername(key);
          if (!k) return;
          if (!normalized[k]) normalized[k] = { ...value, displayName: value.displayName || key };
        });
        localStorage.setItem('users', JSON.stringify(normalized));
        allUsers = normalized;
      } catch (e) {
        localStorage.setItem('users', JSON.stringify({}));
        allUsers = {};
      }
    };
  
    // ----------------------------
    // VIDEO BACKGROUND ELEMENTS
    // ----------------------------
    const bgVideo = document.getElementById('bg-video');
    const bgTitle = document.getElementById('bg-title');
    const bgPrevBtn = document.getElementById('bg-prev-btn');
    const bgNextBtn = document.getElementById('bg-next-btn');
  
    // ----------------------------
    // TASK UI ELEMENTS (from your HTML)
    // ----------------------------
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskNotesInput = document.getElementById('task-notes');
    const taskDateInput = document.getElementById('task-date');
    const taskCategorySelect = document.getElementById('task-category');
    const taskPrioritySelect = document.getElementById('task-priority');
    const taskRecurrenceSelect = document.getElementById('task-recurrence');
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const categoryFilterContainer = document.getElementById('category-filter-buttons');
    const taskCountEl = document.getElementById('task-count');
    const categoryInput = document.getElementById('category-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryListEl = document.getElementById('category-list');
    const searchInput = document.getElementById('search-input');
    const statsBtn = document.getElementById('stats-btn');
    const exportBtn = document.getElementById('export-btn');
    const taskModal = document.getElementById('task-modal');
    const editTaskForm = document.getElementById('edit-task-form');
    const dashboardModal = document.getElementById('dashboard-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const friendsBtn = document.getElementById('friends-btn');
    const friendsModal = document.getElementById('friends-modal');
    const inviteForm = document.getElementById('invite-form');
    const inviteUsernameInput = document.getElementById('invite-username');
    const friendRequestsList = document.getElementById('friend-requests-list');
    const friendsList = document.getElementById('friends-list');
    const taskModalTitle = document.getElementById('task-modal-title');
    const isSharedTaskCheckbox = document.getElementById('is-shared-task');
    const friendSelectContainer = document.getElementById('friend-select-container');
    const friendCheckboxesContainer = document.getElementById('friend-checkboxes');
    const weeklyChartEl = document.getElementById('weekly-chart');
    const categoryChartEl = document.getElementById('category-chart');
  
    // ----------------------------
    // STATE
    // ----------------------------
    let tasks = JSON.parse(localStorage.getItem('tasks_' + (currentUser || '')) || '[]');
    let categories = JSON.parse(localStorage.getItem('categories_' + (currentUser || '')) || '["General"]');
    let currentFilter = 'all';
    let currentCategoryFilter = null;
    let draggedElement = null;
    let allUsers = JSON.parse(localStorage.getItem('users') || '{}');
    let friendRequests = JSON.parse(localStorage.getItem('friendRequests_' + (currentUser || '')) || '{}');
    let friends = JSON.parse(localStorage.getItem('friends_' + (currentUser || '')) || '[]');
  
    // ----------------------------
    // HELPERS FOR LOCAL STORAGE
    // ----------------------------
    const saveTasks = () => { if (!currentUser) return; localStorage.setItem('tasks_' + currentUser, JSON.stringify(tasks)); };
    const saveCategories = () => { if (!currentUser) return; localStorage.setItem('categories_' + currentUser, JSON.stringify(categories)); };
    const saveFriendRequests = () => { if (!currentUser) return; localStorage.setItem('friendRequests_' + currentUser, JSON.stringify(friendRequests)); };
    const saveFriends = () => { if (!currentUser) return; localStorage.setItem('friends_' + currentUser, JSON.stringify(friends)); };
    const saveAllUsers = () => localStorage.setItem('users', JSON.stringify(allUsers || {}));
  
    // ----------------------------
    // UI: show/hide auth/app
    // ----------------------------
    const showApp = () => {
      if (authModal) authModal.style.display = 'none';
      if (appContainer) appContainer.style.display = 'block';
      if (currentUserDisplay) currentUserDisplay.textContent = (allUsers[currentUser] && allUsers[currentUser].displayName) || currentUser || '';
      init(); // initialize app after we show
    };
  
    const showAuthScreen = () => {
      if (appContainer) appContainer.style.display = 'none';
      if (authModal) authModal.style.display = 'flex';
    };
  
    // ----------------------------
    // AUTH: handle signin/signup
    // ----------------------------
    const handleAuth = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const usernameEl = document.getElementById('auth-username');
      const passwordEl = document.getElementById('auth-password');
      const rawUsername = usernameEl ? usernameEl.value : '';
      const password = passwordEl ? passwordEl.value : '';
      const username = normalizeUsername(rawUsername);
  
      if (!username || !password) { alert('Please enter both username and password.'); return; }
  
      const users = JSON.parse(localStorage.getItem('users') || '{}');
  
      if (isSigningUp) {
        if (users[username]) { alert('Username already exists. Please choose another.'); return; }
        // Create account
        users[username] = { password, createdAt: new Date().toISOString(), displayName: rawUsername.trim() || username };
        localStorage.setItem('users', JSON.stringify(users));
        allUsers = users;
        saveAllUsers();
        currentUser = username;
        localStorage.setItem('currentUser', username);
        alert('Account created successfully! Welcome!');
        showApp();
      } else {
        // Sign in
        if (users[username] && users[username].password === password) {
          currentUser = username;
          localStorage.setItem('currentUser', username);
          // refresh in-memory state for this user
          allUsers = JSON.parse(localStorage.getItem('users') || '{}');
          tasks = JSON.parse(localStorage.getItem('tasks_' + currentUser) || '[]');
          categories = JSON.parse(localStorage.getItem('categories_' + currentUser) || '["General"]');
          friendRequests = JSON.parse(localStorage.getItem('friendRequests_' + currentUser) || '{}');
          friends = JSON.parse(localStorage.getItem('friends_' + currentUser) || '[]');
          showApp();
        } else {
          console.log('Login failed — normalized username:', username, 'stored keys:', Object.keys(users));
          alert('Invalid username or password.');
        }
      }
    };
  
    const switchToSignUp = (ev) => {
      if (ev && ev.preventDefault) ev.preventDefault();
      isSigningUp = true;
      if (authTitle) authTitle.textContent = 'Sign Up';
      if (authSubmitBtn) authSubmitBtn.textContent = 'Sign Up';
      if (showSignupAnchor) {
        showSignupAnchor.innerHTML = 'Already have an account? <a href="#" id="show-signin">Sign In</a>';
        const showSignin = document.getElementById('show-signin');
        if (showSignin) showSignin.addEventListener('click', switchToSignIn);
      }
    };
  
    const switchToSignIn = (ev) => {
      if (ev && ev.preventDefault) ev.preventDefault();
      isSigningUp = false;
      if (authTitle) authTitle.textContent = 'Sign In';
      if (authSubmitBtn) authSubmitBtn.textContent = 'Sign In';
      if (showSignupAnchor) {
        showSignupAnchor.innerHTML = `Don't have an account? <a href="#" id="show-signup">Sign Up</a>`;
        const ss = document.getElementById('show-signup');
        if (ss) ss.addEventListener('click', switchToSignUp);
      }
    };
  
    const signOut = () => {
      localStorage.removeItem('currentUser');
      currentUser = null;
      tasks = []; categories = ['General']; friendRequests = {}; friends = [];
      if (authForm) authForm.reset();
      showAuthScreen();
    };
  
    // ----------------------------
    // SAMPLE TASKS (if empty)
    // ----------------------------
    const createSampleTasks = () => {
      const today = new Date();
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(today); nextMonth.setMonth(nextMonth.getMonth() + 1);
  
      const sample = [
        { id: Date.now() + 1, text: 'Finalize Q4 Project Proposal', notes: 'Incorporate feedback.', completed: false, dueDate: yesterday.toISOString().split('T')[0], category: 'Work', priority: 'high', recurrence: '', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
        { id: Date.now() + 2, text: 'Morning Workout', notes: 'Cardio + strength', completed: false, dueDate: today.toISOString().split('T')[0], category: 'Health', priority: 'medium', recurrence: 'daily', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
        { id: Date.now() + 3, text: 'Read Chapter 5: Clean Code', notes: '', completed: false, dueDate: tomorrow.toISOString().split('T')[0], category: 'Learning', priority: 'low', recurrence: '', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] }
      ];
      localStorage.setItem('tasks_' + currentUser, JSON.stringify(sample));
      return sample;
    };
  
    // ----------------------------
    // VIDEO BACKGROUND ROTATION
    // ----------------------------
    const videoSources = [
      { title: 'Productive Workspace', url: './videos/task-background.mp4' },
      { title: 'Just a video', url: './videos/background-1.mp4' },
      { title: 'Tech Data Flow', url: './videos/background-2.mp4' },
      { title: 'Abstract Particles', url: './videos/background-3.mp4' },
      { title: 'Calm Clouds', url: 'https://storage.coverr.co/videos/coverr-clouds-sky-5459/1080p.mp4' },
      { title: 'Sunset Gradient', type: 'css', css: 'linear-gradient(-45deg,#f093fb,#f5576c,#4facfe,#00f2fe)' }
    ];
    let currentVideoIndex = 0;
    let backgroundTimer = null;
  
    const setVideoSource = (index) => {
      clearTimeout(backgroundTimer);
      if (!videoSources || videoSources.length === 0) return;
      currentVideoIndex = (index + videoSources.length) % videoSources.length;
      const source = videoSources[currentVideoIndex];
  
      if (bgVideo) { try { bgVideo.pause(); } catch (e) {} bgVideo.src = ''; bgVideo.style.display = 'none'; }
      document.body.style.background = '';
  
      if (source.type === 'css') {
        document.body.style.background = source.css;
        if (bgTitle) bgTitle.textContent = source.title;
        backgroundTimer = setTimeout(() => setVideoSource(currentVideoIndex + 1), 10000);
      } else {
        if (bgVideo) {
          bgVideo.src = source.url;
          bgVideo.style.display = 'block';
          if (bgTitle) bgTitle.textContent = source.title;
          bgVideo.play().catch(err => console.warn('Video play blocked', err));
        } else {
          document.body.style.background = 'linear-gradient(180deg,#111,#333)';
          if (bgTitle) bgTitle.textContent = source.title;
        }
      }
    };
  
    if (bgVideo) bgVideo.addEventListener('ended', () => setVideoSource(currentVideoIndex + 1));
    if (bgPrevBtn) bgPrevBtn.addEventListener('click', () => setVideoSource(currentVideoIndex - 1));
    if (bgNextBtn) bgNextBtn.addEventListener('click', () => setVideoSource(currentVideoIndex + 1));
    setVideoSource(0);
  
    // ----------------------------
    // RENDER / UI helpers
    // ----------------------------
    const updateTaskCount = () => {
      if (!taskCountEl) return;
      const left = tasks.filter(t => !t.completed).length;
      taskCountEl.textContent = `${left} tasks left`;
    };
  
    const renderCategories = () => {
      if (taskCategorySelect) {
        taskCategorySelect.innerHTML = '<option value="">No Category</option>';
        (categories || []).forEach(cat => {
          const opt = document.createElement('option'); opt.value = cat; opt.textContent = cat;
          taskCategorySelect.appendChild(opt);
        });
      }
      if (categoryListEl) {
        categoryListEl.innerHTML = '';
        (categories || []).forEach(cat => {
          const tag = document.createElement('div'); tag.className = 'category-tag';
          tag.innerHTML = `${cat} <button class="remove-category" data-category="${cat}">&times;</button>`;
          categoryListEl.appendChild(tag);
        });
      }
      if (categoryFilterContainer) {
        categoryFilterContainer.innerHTML = '';
        (categories || []).forEach(cat => {
          const btn = document.createElement('button'); btn.className = 'category-filter-btn'; btn.dataset.category = cat; btn.textContent = cat;
          categoryFilterContainer.appendChild(btn);
        });
      }
    };
  
    const createTaskElement = (task) => {
      const li = document.createElement('li');
      const isOwner = task.ownerId === currentUser;
      li.className = `task-item priority-${task.priority} ${!isOwner ? 'shared-task' : ''}`;
      li.draggable = Boolean(isOwner);
      li.dataset.id = task.id;
  
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const today = new Date(); today.setHours(0,0,0,0);
      const isOverdue = dueDate && dueDate < today && !task.completed;
      if (isOverdue) li.classList.add('overdue');
  
      li.innerHTML = `
        <div class="task-main-content">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} ${!isOwner ? 'disabled' : ''}/>
          <div class="task-content">
            <span class="task-text">${escapeHtml(task.text)}</span>
            ${task.notes ? `<div class="task-notes">${escapeHtml(task.notes)}</div>` : ''}
          </div>
          <div class="task-meta">
            ${!isOwner ? `<span class="shared-task-indicator">Shared by ${escapeHtml(task.ownerName || '')}</span>` : ''}
            <span class="task-priority">${task.priority}</span>
            ${task.category ? `<span class="task-category-tag">${escapeHtml(task.category)}</span>` : ''}
            ${task.dueDate ? `<span class="task-due-date">${task.dueDate}</span>` : ''}
            ${isOwner ? `<button class="edit-task-btn" title="Edit Task"><i class="fas fa-edit"></i></button>` : ''}
            ${isOwner ? `<button class="delete-btn" title="Delete Task">&times;</button>` : ''}
          </div>
        </div>
      `;
      return li;
    };
  
    function escapeHtml(text) {
      if (!text && text !== 0) return '';
      return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  
    const renderTasks = () => {
      if (!taskList) return;
      taskList.innerHTML = '';
      const searchVal = searchInput ? (searchInput.value || '').toLowerCase() : '';
      const today = new Date(); today.setHours(0,0,0,0);
  
      const filtered = (tasks || []).filter(task => {
        const isOwner = task.ownerId === currentUser;
        const isSharedWithMe = task.sharedWith && task.sharedWith.includes(currentUser);
        const visible = isOwner || isSharedWithMe;
        const matchesStatus = currentFilter === 'all' || (currentFilter === 'active' && !task.completed) || (currentFilter === 'completed' && task.completed);
        const matchesCategory = !currentCategoryFilter || task.category === currentCategoryFilter;
        const matchesSearch = (task.text && task.text.toLowerCase().includes(searchVal)) || (task.notes && task.notes.toLowerCase().includes(searchVal));
        return visible && matchesStatus && matchesCategory && matchesSearch;
      });
  
      filtered.forEach(t => {
        const el = createTaskElement(t);
        taskList.appendChild(el);
      });
  
      updateTaskCount();
    };
  
    // ----------------------------
    // TASK OPERATIONS
    // ----------------------------
    const addTask = (text, notes, dueDate, category, priority, recurrence, isShared, sharedWith) => {
      const newTask = {
        id: Date.now(),
        text: text || '',
        notes: notes || '',
        completed: false,
        dueDate: dueDate || '',
        category: category || '',
        priority: priority || 'medium',
        recurrence: recurrence || '',
        subtasks: [],
        ownerId: currentUser,
        ownerName: (allUsers[currentUser] && allUsers[currentUser].displayName) || currentUser,
        isShared: Boolean(isShared),
        sharedWith: sharedWith || []
      };
      tasks.unshift(newTask);
      saveTasks();
      scheduleNotification(newTask);
      if (taskList) {
        const el = createTaskElement(newTask);
        taskList.prepend(el);
        setTimeout(() => el.classList.add('task-enter'), 10);
        updateTaskCount();
      }
    };
  
    const deleteTask = (id) => {
      if (!taskList) return;
      const taskEl = taskList.querySelector(`.task-item[data-id="${id}"]`);
      if (!taskEl) return;
      taskEl.classList.add('task-exit');
      taskEl.addEventListener('animationend', () => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
      }, { once: true });
    };
  
    const toggleTask = (id) => {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      saveTasks();
      renderTasks();
    };
  
    const editTask = (id) => {
      const task = tasks.find(t => t.id === id);
      if (!task || task.ownerId !== currentUser) return;
      if (taskModalTitle) taskModalTitle.textContent = 'Edit Task';
      const idEl = document.getElementById('edit-task-id');
      const textEl = document.getElementById('edit-task-text');
      const notesEl = document.getElementById('edit-task-notes');
      const dateEl = document.getElementById('edit-task-date');
      const categoryEl = document.getElementById('edit-task-category');
      const priorityEl = document.getElementById('edit-task-priority');
      if (idEl) idEl.value = task.id;
      if (textEl) textEl.value = task.text;
      if (notesEl) notesEl.value = task.notes;
      if (dateEl) dateEl.value = task.dueDate;
      if (categoryEl) categoryEl.value = task.category;
      if (priorityEl) priorityEl.value = task.priority;
      if (isSharedTaskCheckbox) isSharedTaskCheckbox.checked = task.isShared;
      if (friendSelectContainer) friendSelectContainer.style.display = task.isShared ? 'block' : 'none';
      renderFriendCheckboxes();
      if (task.isShared) {
        const boxes = document.querySelectorAll('input[name="share-friend"]');
        boxes.forEach(cb => { cb.checked = task.sharedWith.includes(cb.value); });
      }
      if (taskModal) taskModal.style.display = 'flex';
    };
  
    const updateTask = (id, updatedData) => {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) return;
      tasks[idx] = { ...tasks[idx], ...updatedData };
      saveTasks();
      scheduleNotification(tasks[idx]);
      renderTasks();
    };
  
    const reorderTasks = (startIndex, endIndex) => {
      const [removed] = tasks.splice(startIndex, 1);
      tasks.splice(endIndex, 0, removed);
      saveTasks();
      renderTasks();
    };
  
    // ----------------------------
    // RECURRING TASKS
    // ----------------------------
    const calculateNextDueDate = (currentDate, recurrence) => {
      const d = new Date(currentDate);
      if (recurrence === 'daily') d.setDate(d.getDate() + 1);
      if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
      if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    };
  
    const checkRecurringTasks = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      (tasks || []).forEach(task => {
        if (task.recurrence && task.dueDate && task.dueDate <= todayStr && !task.completed && task.ownerId === currentUser) {
          const newTask = { ...task, id: Date.now(), completed: false, dueDate: calculateNextDueDate(task.dueDate, task.recurrence) };
          tasks.push(newTask);
          task.completed = true;
        }
      });
      saveTasks();
      renderTasks();
    };
  
    // ----------------------------
    // DASHBOARD & EXPORT
    // ----------------------------
    const getWeeklyCompletedData = () => {
      const today = new Date();
      const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      const data = [0,0,0,0,0,0,0];
      (tasks || []).filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= oneWeekAgo).forEach(t => {
        const day = new Date(t.completedAt).getDay();
        data[day === 0 ? 6 : day - 1]++;
      });
      return data;
    };
  
    const getCategoryData = () => {
      const map = {};
      (tasks || []).forEach(t => {
        if (t.category) map[t.category] = (map[t.category] || 0) + 1;
      });
      return map;
    };
  
    const renderCharts = () => {
      if (typeof Chart === 'undefined') return;
      if (!weeklyChartEl || !categoryChartEl) return;
      try {
        const weekCtx = weeklyChartEl.getContext('2d');
        const weekData = getWeeklyCompletedData();
        new Chart(weekCtx, { type: 'bar', data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ label:'Completed', data: weekData }] }, options: { scales:{ y:{ beginAtZero:true } } } });
        const catCtx = categoryChartEl.getContext('2d');
        const catData = getCategoryData();
        new Chart(catCtx, { type: 'pie', data: { labels: Object.keys(catData), datasets: [{ data: Object.values(catData) }] } });
      } catch (err) { console.warn('Chart render error', err); }
    };
  
    const showDashboard = () => {
      if (dashboardModal) dashboardModal.style.display = 'flex';
      renderCharts();
    };
  
    const exportTasks = () => {
      const dataStr = JSON.stringify(tasks, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const filename = `tasks_${new Date().toISOString().split('T')[0]}.json`;
      const a = document.createElement('a'); a.href = dataUri; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
  
    // ----------------------------
    // NOTIFICATIONS
    // ----------------------------
    const requestNotificationPermission = () => { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); };
  
    const scheduleNotification = (task) => {
      if (!task || !task.dueDate) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const due = new Date(task.dueDate);
      const now = new Date();
      const msBefore = (60 * 60 * 1000); // 1 hour
      const timeUntil = due - now - msBefore;
      if (timeUntil > 0) {
        setTimeout(() => {
          try { new Notification('Task Due Soon!', { body: `Task "${task.text}" is due soon.`, icon: './favicon.ico' }); } catch (e) {}
        }, timeUntil);
      }
    };
  
    // ----------------------------
    // SOCIAL (friends/invites)
    // ----------------------------
    const renderFriendsList = () => {
      if (friendRequestsList) {
        friendRequestsList.innerHTML = '';
        if (!friendRequests || Object.keys(friendRequests).length === 0) friendRequestsList.innerHTML = '<p>No pending requests.</p>';
        else {
          Object.entries(friendRequests).forEach(([username, status]) => {
            if (status === 'received') {
              const item = document.createElement('div'); item.className = 'request-item';
              item.innerHTML = `<span>${escapeHtml(username)} wants to be your friend</span>
                <div class="request-buttons">
                  <button class="accept-btn" data-user="${escapeHtml(username)}">Accept</button>
                  <button class="decline-btn" data-user="${escapeHtml(username)}">Decline</button>
                </div>`;
              friendRequestsList.appendChild(item);
            }
          });
        }
      }
  
      if (friendsList) {
        friendsList.innerHTML = '';
        if (!friends || friends.length === 0) friendsList.innerHTML = '<p>No friends yet. Invite someone!</p>';
        else {
          friends.forEach(f => {
            const item = document.createElement('div'); item.className = 'friend-item';
            item.innerHTML = `<span>${escapeHtml(f)}</span> <button class="remove-friend-btn" data-user="${escapeHtml(f)}">Remove</button>`;
            friendsList.appendChild(item);
          });
        }
        renderFriendCheckboxes();
      }
    };
  
    const renderFriendCheckboxes = () => {
      if (!friendCheckboxesContainer) return;
      friendCheckboxesContainer.innerHTML = '';
      if (!friends || friends.length === 0) friendCheckboxesContainer.innerHTML = '<p>You have no friends to share with.</p>';
      else {
        friends.forEach(f => {
          const lbl = document.createElement('label');
          lbl.innerHTML = `<input type="checkbox" name="share-friend" value="${escapeHtml(f)}"> ${escapeHtml(f)}`;
          friendCheckboxesContainer.appendChild(lbl);
        });
      }
    };
  
    const sendInvite = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const recipientRaw = inviteUsernameInput ? inviteUsernameInput.value : '';
      const recipient = normalizeUsername(recipientRaw);
      if (!recipient) { alert('Enter a username to invite.'); return; }
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (!users[recipient]) { alert(`User "${recipientRaw}" does not exist.`); return; }
      if (recipient === currentUser) { alert('You cannot invite yourself.'); return; }
      if (friends.includes(recipient)) { alert(`You are already friends with ${recipient}.`); return; }
      const recRequests = JSON.parse(localStorage.getItem('friendRequests_' + recipient) || '{}');
      recRequests[currentUser] = 'received';
      localStorage.setItem('friendRequests_' + recipient, JSON.stringify(recRequests));
      alert(`Friend request sent to ${recipientRaw}!`);
      if (inviteForm) inviteForm.reset();
    };
  
    const handleFriendRequestClick = (e) => {
      const btn = e.target;
      if (!btn || !btn.dataset) return;
      const fromUser = btn.dataset.user;
      if (!fromUser) return;
      const isAccept = btn.classList && btn.classList.contains('accept-btn');
      if (isAccept) {
        if (!friends.includes(fromUser)) friends.push(fromUser);
        saveFriends();
      }
      delete friendRequests[fromUser];
      saveFriendRequests();
      const senderFriends = JSON.parse(localStorage.getItem('friends_' + fromUser) || '[]');
      if (isAccept && !senderFriends.includes(currentUser)) {
        senderFriends.push(currentUser);
        localStorage.setItem('friends_' + fromUser, JSON.stringify(senderFriends));
      }
      const senderRequests = JSON.parse(localStorage.getItem('friendRequests_' + fromUser) || '{}');
      delete senderRequests[currentUser];
      localStorage.setItem('friendRequests_' + fromUser, JSON.stringify(senderRequests));
      renderFriendsList();
    };
  
    const removeFriend = (e) => {
      const friendToRemove = e.target ? e.target.dataset.user : null;
      if (!friendToRemove) return;
      friends = friends.filter(f => f !== friendToRemove);
      saveFriends();
      const otherFriends = JSON.parse(localStorage.getItem('friends_' + friendToRemove) || '[]');
      const updated = otherFriends.filter(f => f !== currentUser);
      localStorage.setItem('friends_' + friendToRemove, JSON.stringify(updated));
      renderFriendsList();
    };
  
    // ----------------------------
    // EVENT BINDING: central
    // ----------------------------
    const setupEventListeners = () => {
      // task submit
      if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const text = taskInput ? taskInput.value.trim() : '';
          if (!text) return;
          const isShared = isSharedTaskCheckbox ? isSharedTaskCheckbox.checked : false;
          let sharedWith = [];
          if (isShared) { const boxes = document.querySelectorAll('input[name="share-friend"]:checked'); sharedWith = Array.from(boxes).map(b => b.value); }
          addTask(text, taskNotesInput ? taskNotesInput.value : '', taskDateInput ? taskDateInput.value : '', taskCategorySelect ? taskCategorySelect.value : '', taskPrioritySelect ? taskPrioritySelect.value : 'medium', taskRecurrenceSelect ? taskRecurrenceSelect.value : '', isShared, sharedWith);
          if (taskForm) taskForm.reset();
          if (friendSelectContainer) friendSelectContainer.style.display = 'none';
        });
      }
  
      // edit task submit
      if (editTaskForm) {
        editTaskForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const idEl = document.getElementById('edit-task-id');
          const id = idEl ? Number(idEl.value) : null;
          const isShared = isSharedTaskCheckbox ? isSharedTaskCheckbox.checked : false;
          let sharedWith = [];
          if (isShared) { const boxes = document.querySelectorAll('input[name="share-friend"]:checked'); sharedWith = Array.from(boxes).map(b => b.value); }
          const updated = {
            text: (document.getElementById('edit-task-text') ? document.getElementById('edit-task-text').value : ''),
            notes: (document.getElementById('edit-task-notes') ? document.getElementById('edit-task-notes').value : ''),
            dueDate: (document.getElementById('edit-task-date') ? document.getElementById('edit-task-date').value : ''),
            category: (document.getElementById('edit-task-category') ? document.getElementById('edit-task-category').value : ''),
            priority: (document.getElementById('edit-task-priority') ? document.getElementById('edit-task-priority').value : ''),
            isShared, sharedWith
          };
          if (id !== null) updateTask(id, updated);
          if (taskModal) taskModal.style.display = 'none';
        });
      }
  
      // task list click (toggle, delete, edit)
      if (taskList) {
        taskList.addEventListener('click', (e) => {
          const t = e.target;
          const li = t.closest('.task-item');
          if (!li) return;
          const id = Number(li.dataset.id);
          if (t.classList.contains('task-checkbox')) toggleTask(id);
          else if (t.classList.contains('delete-btn')) deleteTask(id);
          else if (t.closest('.edit-task-btn')) editTask(id);
        });
  
        // drag & drop
        taskList.addEventListener('dragstart', (e) => { if (e.target && e.target.classList.contains('task-item')) { draggedElement = e.target; e.target.classList.add('dragging'); } });
        taskList.addEventListener('dragend', (e) => { if (e.target && e.target.classList.contains('task-item')) e.target.classList.remove('dragging'); });
        taskList.addEventListener('dragover', (e) => { e.preventDefault(); const after = getDragAfterElement(taskList, e.clientY); if (!after) taskList.appendChild(draggedElement); else taskList.insertBefore(draggedElement, after); });
        taskList.addEventListener('drop', (e) => {
          e.preventDefault();
          if (!draggedElement) return;
          const draggedId = Number(draggedElement.dataset.id);
          const els = [...taskList.querySelectorAll('.task-item')];
          const newIndex = els.findIndex(it => it.dataset.id === draggedId.toString());
          const oldIndex = tasks.findIndex(t => t.id === draggedId);
          if (oldIndex !== -1 && newIndex !== -1) reorderTasks(oldIndex, newIndex);
        });
      }
  
      // search, stats, export
      if (searchInput) searchInput.addEventListener('input', renderTasks);
      if (statsBtn) statsBtn.addEventListener('click', showDashboard);
      if (exportBtn) exportBtn.addEventListener('click', exportTasks);
  
      // close modals
      if (closeBtns && closeBtns.length) closeBtns.forEach(btn => btn.addEventListener('click', () => { const modal = btn.closest('.modal'); if (modal) modal.style.display = 'none'; }));
  
      // window click for modal background close
      window.addEventListener('click', (e) => { if (e.target && e.target.classList && e.target.classList.contains('modal')) e.target.style.display = 'none'; });
  
      // categories
      if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => addCategory(categoryInput ? categoryInput.value.trim() : ''));
      if (categoryInput) categoryInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCategory(categoryInput.value.trim()); });
      if (categoryListEl) categoryListEl.addEventListener('click', (e) => { if (e.target && e.target.classList && e.target.classList.contains('remove-category')) removeCategory(e.target.dataset.category); });
  
      // filter buttons
      if (filterButtons && filterButtons.length) filterButtons.forEach(btn => btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
      }));
  
      if (categoryFilterContainer) categoryFilterContainer.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('category-filter-btn')) {
          const btn = e.target; const category = btn.dataset.category;
          if (currentCategoryFilter === category) { currentCategoryFilter = null; btn.classList.remove('active'); }
          else { document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active')); currentCategoryFilter = category; btn.classList.add('active'); }
          renderTasks();
        }
      });
  
      // friends modal open and invite
      if (friendsBtn) friendsBtn.addEventListener('click', () => { if (friendsModal) friendsModal.style.display = 'flex'; renderFriendsList(); });
      if (inviteForm) inviteForm.addEventListener('submit', sendInvite);
      if (friendRequestsList) friendRequestsList.addEventListener('click', handleFriendRequestClick);
      if (friendsList) friendsList.addEventListener('click', (e) => { if (e.target && e.target.classList && e.target.classList.contains('remove-friend-btn')) removeFriend(e); });
  
      if (isSharedTaskCheckbox) isSharedTaskCheckbox.addEventListener('change', (e) => { if (friendSelectContainer) friendSelectContainer.style.display = e.target.checked ? 'block' : 'none'; });
  
      // keyboard shortcut
      setupKeyboardShortcuts();
    };
  
    // ----------------------------
    // DRAG & DROP HELPER
    // ----------------------------
    const getDragAfterElement = (container, y) => {
      const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    };
  
    // ----------------------------
    // CATEGORY HELPERS
    // ----------------------------
    const addCategory = (name) => {
      if (!name) return;
      if (!categories.includes(name)) { categories.push(name); saveCategories(); renderCategories(); }
    };
  
    const removeCategory = (name) => {
      if (!name || name === 'General') return;
      categories = categories.filter(c => c !== name);
      tasks.forEach(t => { if (t.category === name) t.category = ''; });
      saveCategories(); saveTasks(); renderCategories(); renderTasks();
    };
  
    // ----------------------------
    // KEYBOARD SHORTCUTS
    // ----------------------------
    function setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); if (searchInput) searchInput.focus(); }
      });
    }
  
    // ----------------------------
    // INIT (after signin)
    // ----------------------------
    const init = () => {
      // ensure arrays are defined
      tasks = tasks || [];
      categories = categories || ['General'];
      friendRequests = friendRequests || {};
      friends = friends || [];
      if (!tasks || tasks.length === 0) tasks = createSampleTasks();
      renderCategories();
      renderTasks();
      setupEventListeners();
      checkRecurringTasks();
      requestNotificationPermission();
      renderFriendsList();
    };
  
    // ----------------------------
    // INITIAL RUN: migrate users then show appropriate screen
    // moved here so init() is defined before showApp calls it
    // ----------------------------
    migrateUsersToNormalized();
    allUsers = JSON.parse(localStorage.getItem('users') || '{}');
  
    if (currentUser) showApp(); else showAuthScreen();
  
    // Attach high-level auth event handlers
    if (authForm) authForm.addEventListener('submit', handleAuth);
    if (showSignupAnchor) showSignupAnchor.addEventListener('click', (e) => { e.preventDefault(); switchToSignUp(e); });
    if (signOutBtn) signOutBtn.addEventListener('click', signOut);
  
    // ----------------------------
    // Finally: attach a small global listener to wire sign-in anchors created dynamically
    // ----------------------------
    (function wireAuthAnchors() {
      document.body.addEventListener('click', (e) => {
        const target = e.target;
        if (!target) return;
        if (target.id === 'show-signup') { e.preventDefault(); switchToSignUp(e); }
        if (target.id === 'show-signin') { e.preventDefault(); switchToSignIn(e); }
      });
    })();
  
    // ----------------------------
    // END of main closure
    // ----------------------------
  }); // end DOMContentLoaded
  