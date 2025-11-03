document.addEventListener('DOMContentLoaded', () => {

    // --- AUTHENTICATION STATE & ELEMENTS ---
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const showSignupLink = document.getElementById('show-signup');
    const appContainer = document.getElementById('app');
    const signOutBtn = document.getElementById('sign-out-btn');
    const currentUserDisplay = document.getElementById('current-user-display');

    let isSigningUp = false;
    let currentUser = localStorage.getItem('currentUser');

    // --- AUTHENTICATION FUNCTIONS ---
    const showApp = () => {
        if (authModal) authModal.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
        if (currentUserDisplay) currentUserDisplay.textContent = currentUser;
        init();
    };

    const showAuthScreen = () => {
        if (appContainer) appContainer.style.display = 'none';
        if (authModal) authModal.style.display = 'flex';
    };

    const handleAuth = (e) => {
        e.preventDefault();
        const usernameEl = document.getElementById('auth-username');
        const passwordEl = document.getElementById('auth-password');
        const username = usernameEl ? usernameEl.value.trim() : '';
        const password = passwordEl ? passwordEl.value : '';

        if (!username || !password) { alert('Please enter both username and password.'); return; }

        const users = JSON.parse(localStorage.getItem('users')) || {};

        if (isSigningUp) {
            if (users[username]) { alert('Username already exists. Please choose another.'); }
            else {
                users[username] = { password, createdAt: new Date().toISOString() };
                localStorage.setItem('users', JSON.stringify(users));
                currentUser = username;
                localStorage.setItem('currentUser', username);
                alert('Account created successfully! Welcome!');
                showApp();
            }
        } else {
            if (users[username] && users[username].password === password) {
                currentUser = username;
                localStorage.setItem('currentUser', username);
                showApp();
            } else { alert('Invalid username or password.'); }
        }
    };

    const switchToSignUp = () => {
        isSigningUp = true;
        if (authTitle) authTitle.textContent = 'Sign Up';
        if (authSubmitBtn) authSubmitBtn.textContent = 'Sign Up';
        if (showSignupLink) {
            showSignupLink.innerHTML = 'Already have an account? <a href="#" id="show-signin">Sign In</a>';
            const el = document.getElementById('show-signin');
            if (el) el.addEventListener('click', (ev) => { ev.preventDefault(); switchToSignIn(); });
        }
    };
    const switchToSignIn = () => {
        isSigningUp = false;
        if (authTitle) authTitle.textContent = 'Sign In';
        if (authSubmitBtn) authSubmitBtn.textContent = 'Sign In';
        if (showSignupLink) {
            showSignupLink.innerHTML = 'Don\'t have an account? <a href="#" id="show-signup">Sign Up</a>';
            const el = document.getElementById('show-signup');
            if (el) el.addEventListener('click', (ev) => { ev.preventDefault(); switchToSignUp(); });
        }
    };
    const signOut = () => {
        localStorage.removeItem('currentUser');
        currentUser = null;
        if (authForm) authForm.reset();
        showAuthScreen();
    };

    // --- SAMPLE TASKS ---
    const createSampleTasks = () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const sampleTasks = [
            { id: Date.now() + 1, text: 'Finalize Q4 Project Proposal', notes: 'Incorporate feedback from the last team meeting.', completed: false, dueDate: yesterday.toISOString().split('T')[0], category: 'Work', priority: 'high', recurrence: '', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
            { id: Date.now() + 2, text: 'Morning Workout', notes: '30 minutes of cardio and 20 minutes of strength training.', completed: false, dueDate: today.toISOString().split('T')[0], category: 'Health', priority: 'medium', recurrence: 'daily', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
            { id: Date.now() + 3, text: 'Read Chapter 5 of "Clean Code"', notes: 'Focus on the sections about code formatting.', completed: false, dueDate: tomorrow.toISOString().split('T')[0], category: 'Learning', priority: 'low', recurrence: '', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
            { id: Date.now() + 4, text: 'Plan Weekend Trip', notes: 'Book a hotel and research activities.', completed: false, dueDate: '', category: 'Personal', priority: 'high', recurrence: '', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
            { id: Date.now() + 5, text: 'Buy Groceries', notes: 'Milk, Bread, Eggs, Chicken, Avocados.', completed: true, dueDate: today.toISOString().split('T')[0], category: 'Personal', priority: 'medium', recurrence: '', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
            { id: Date.now() + 6, text: 'Team Sync-Up Meeting', notes: 'Weekly stand-up to discuss progress.', completed: false, dueDate: nextWeek.toISOString().split('T')[0], category: 'Work', priority: 'medium', recurrence: 'weekly', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
            { id: Date.now() + 7, text: 'Submit Timesheet', notes: 'Log all hours for the current pay period.', completed: false, dueDate: nextMonth.toISOString().split('T')[0], category: 'Work', priority: 'low', recurrence: '', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] },
            { id: Date.now() + 8, text: 'Call Mom', notes: '', completed: false, dueDate: '', category: '', priority: 'low', recurrence: '', subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared: false, sharedWith: [] }
        ];
        localStorage.setItem('tasks_' + currentUser, JSON.stringify(sampleTasks));
        return sampleTasks;
    };

    // --- INITIAL APP LOAD ---
    if (currentUser) { showApp(); } else { showAuthScreen(); }

    // --- AUTH EVENT LISTENERS ---
    if (authForm) authForm.addEventListener('submit', handleAuth);
    if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); switchToSignUp(); });
    if (signOutBtn) signOutBtn.addEventListener('click', signOut);


    // =================================================================
    // === MAIN APP LOGIC (Runs only after successful sign-in) ===
    // =================================================================

    // --- VIDEO BACKGROUND LOGIC ---
    const bgVideo = document.getElementById('bg-video');
    const bgTitle = document.getElementById('bg-title');
    const bgPrevBtn = document.getElementById('bg-prev-btn');
    const bgNextBtn = document.getElementById('bg-next-btn');
    const videoSources = [
        { title: 'Productive Workspace', url: './videos/task-background.mp4' }, { title: 'Just a video', url: './videos/background-1.mp4' }, { title: 'Tech Data Flow', url: './videos/background-2.mp4' }, { title: 'Abstract Particles', url: './videos/background-3.mp4' }, { title: 'Calm Clouds', url: 'https://storage.coverr.co/videos/coverr-clouds-sky-5459/1080p.mp4' }, { title: 'Sunset Gradient', type: 'css', css: 'linear-gradient(-45deg, #f093fb, #f5576c, #4facfe, #00f2fe)' }, { title: 'Ocean Waves', type: 'css', css: 'linear-gradient(-45deg, #fa709a, #fee140, #30cfd0, #330867)' }, { title: 'Forest Mist', type: 'css', css: 'linear-gradient(-45deg, #8EC5FC, #E0C3FC, #8ED1FC, #C3F0CA)' }
    ];
    let currentVideoIndex = 0; let backgroundTimer;
    const setVideoSource = (index) => {
        clearTimeout(backgroundTimer);
        currentVideoIndex = (index + videoSources.length) % videoSources.length;
        const source = videoSources[currentVideoIndex];
        if (bgVideo) { bgVideo.src = ''; bgVideo.style.display = 'none'; }
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
                bgVideo.play().catch(error => console.error("Video autoplay failed:", error));
            } else {
                document.body.style.background = 'linear-gradient(180deg,#111,#333)';
                if (bgTitle) bgTitle.textContent = source.title;
            }
        }
    };
    if (bgVideo) {
        bgVideo.addEventListener('ended', () => setVideoSource(currentVideoIndex + 1));
    }
    if (bgPrevBtn) bgPrevBtn.addEventListener('click', () => setVideoSource(currentVideoIndex - 1));
    if (bgNextBtn) bgNextBtn.addEventListener('click', () => setVideoSource(currentVideoIndex + 1));
    setVideoSource(0);

    // --- DOM ELEMENT SELECTION ---
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
    const taskCount = document.getElementById('task-count');
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

    // --- STATE MANAGEMENT ---
    let tasks = JSON.parse(localStorage.getItem('tasks_' + currentUser)) || [];
    let categories = JSON.parse(localStorage.getItem('categories_' + currentUser)) || ['General'];
    let currentFilter = 'all'; let currentCategoryFilter = null; let draggedElement = null;
    let allUsers = JSON.parse(localStorage.getItem('users')) || {};
    let friendRequests = JSON.parse(localStorage.getItem('friendRequests_' + currentUser)) || {};
    let friends = JSON.parse(localStorage.getItem('friends_' + currentUser)) || [];

    // --- INITIALIZATION ---
    const init = () => {
        if (tasks.length === 0) { tasks = createSampleTasks(); }
        renderCategories(); renderTasks(); setupEventListeners(); checkRecurringTasks(); requestNotificationPermission(); renderFriendsList();
    };

    // --- LOCAL STORAGE ---
    const saveTasks = () => localStorage.setItem('tasks_' + currentUser, JSON.stringify(tasks));
    const saveCategories = () => localStorage.setItem('categories_' + currentUser, JSON.stringify(categories));
    const saveFriendRequests = () => localStorage.setItem('friendRequests_' + currentUser, JSON.stringify(friendRequests));
    const saveFriends = () => localStorage.setItem('friends_' + currentUser, JSON.stringify(friends));
    const saveAllUsers = () => localStorage.setItem('users', JSON.stringify(allUsers));

    // --- RENDER FUNCTIONS ---
    const renderCategories = () => {
        if (!taskCategorySelect) return;
        taskCategorySelect.innerHTML = '<option value="">No Category</option>';
        const editCategorySelect = document.getElementById('edit-task-category');
        if (editCategorySelect) editCategorySelect.innerHTML = '<option value="">No Category</option>';
        categories.forEach(cat => {
            const option = document.createElement('option'); option.value = cat; option.textContent = cat;
            taskCategorySelect.appendChild(option); if (editCategorySelect) editCategorySelect.appendChild(option.cloneNode(true));
        });
        if (categoryListEl) {
            categoryListEl.innerHTML = '';
            categories.forEach(cat => {
                const tag = document.createElement('div'); tag.className = 'category-tag';
                tag.innerHTML = `${cat} <span class="remove-category" data-category="${cat}">&times;</span>`;
                categoryListEl.appendChild(tag);
            });
        }
        if (categoryFilterContainer) {
            categoryFilterContainer.innerHTML = '';
            categories.forEach(cat => {
                const btn = document.createElement('button'); btn.className = 'category-filter-btn';
                btn.dataset.category = cat; btn.textContent = cat; categoryFilterContainer.appendChild(btn);
            });
        }
    };
    const renderTasks = () => {
        if (!taskList) return;
        taskList.innerHTML = '';
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let filteredTasks = tasks.filter(task => {
            const isOwner = task.ownerId === currentUser;
            const isSharedWithMe = task.sharedWith && task.sharedWith.includes(currentUser);
            const isVisible = isOwner || isSharedWithMe;
            const matchesStatus = currentFilter === 'all' || (currentFilter === 'active' && !task.completed) || (currentFilter === 'completed' && task.completed);
            const matchesCategory = !currentCategoryFilter || task.category === currentCategoryFilter;
            const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
            const matchesSearch = task.text.toLowerCase().includes(searchVal) || (task.notes && task.notes.toLowerCase().includes(searchVal));
            return isVisible && matchesStatus && matchesCategory && matchesSearch;
        });
        filteredTasks.forEach(task => { const li = createTaskElement(task); taskList.appendChild(li); });
        updateTaskCount();
    };
    const createTaskElement = (task) => {
        const li = document.createElement('li'); const isOwner = task.ownerId === currentUser;
        li.className = `task-item priority-${task.priority} ${!isOwner ? 'shared-task' : ''}`;
        li.draggable = Boolean(isOwner); li.dataset.id = task.id;
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const isOverdue = dueDate && dueDate < today && !task.completed;
        if (isOverdue) li.classList.add('overdue');
        li.innerHTML = `
            <div class="task-main-content">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} ${!isOwner ? 'disabled' : ''}>
                <div class="task-content">
                    <span class="task-text">${task.text}</span>
                    ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                </div>
                <div class="task-meta">
                    ${!isOwner ? `<span class="shared-task-indicator">Shared by ${task.ownerName}</span>` : ''}
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    ${task.category ? `<span class="task-category-tag">${task.category}</span>` : ''}
                    ${task.dueDate ? `<span class="task-due-date">${task.dueDate}</span>` : ''}
                    ${isOwner ? `<button class="edit-task-btn" title="Edit Task"><i class="fas fa-edit"></i></button>` : ''}
                    ${isOwner ? `<button class="delete-btn" title="Delete Task">&times;</button>` : ''}
                </div>
            </div>
        `;
        return li;
    };

    // --- TASK OPERATIONS ---
    const addTask = (text, notes, dueDate, category, priority, recurrence, isShared, sharedWith) => {
        const newTask = { id: Date.now(), text, notes, completed: false, dueDate, category, priority, recurrence, subtasks: [], ownerId: currentUser, ownerName: currentUser, isShared, sharedWith };
        tasks.unshift(newTask); saveTasks(); scheduleNotification(newTask);
        if (taskList) {
            const taskElement = createTaskElement(newTask); taskList.prepend(taskElement);
            setTimeout(() => taskElement.classList.add('task-enter'), 10); updateTaskCount();
        }
    };
    const deleteTask = (id) => {
        if (!taskList) return;
        const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
        if (!taskElement) return; taskElement.classList.add('task-exit');
        taskElement.addEventListener('animationend', () => { tasks = tasks.filter(t => t.id !== id); saveTasks(); renderTasks(); }, { once: true });
    };
    const toggleTask = (id) => { const task = tasks.find(t => t.id === id); if (task) { task.completed = !task.completed; task.completedAt = task.completed ? new Date().toISOString() : null; saveTasks(); renderTasks(); } };
    const editTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task && task.ownerId === currentUser) {
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
                const checkboxes = document.querySelectorAll('input[name="share-friend"]');
                checkboxes.forEach(cb => { cb.checked = task.sharedWith.includes(cb.value); });
            }
            if (taskModal) taskModal.style.display = 'block';
        }
    };
    const updateTask = (id, updatedData) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updatedData };
            saveTasks();
            scheduleNotification(tasks[taskIndex]);
            renderTasks();
        }
    };
    const reorderTasks = (startIndex, endIndex) => {
        const [removed] = tasks.splice(startIndex, 1);
        tasks.splice(endIndex, 0, removed);
        saveTasks();
        renderTasks();
    };

    // --- RECURRING TASKS ---
    const checkRecurringTasks = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        tasks.forEach(task => {
            if (task.recurrence && task.dueDate && task.dueDate <= todayStr && !task.completed && task.ownerId === currentUser) {
                const newTask = { ...task, id: Date.now(), completed: false, dueDate: calculateNextDueDate(task.dueDate, task.recurrence) };
                tasks.push(newTask); task.completed = true;
            }
        });
        saveTasks();
        renderTasks();
    };
    const calculateNextDueDate = (currentDate, recurrence) => {
        const date = new Date(currentDate);
        if (recurrence === 'daily') date.setDate(date.getDate() + 1);
        if (recurrence === 'weekly') date.setDate(date.getDate() + 7);
        if (recurrence === 'monthly') date.setMonth(date.getMonth() + 1);
        return date.toISOString().split('T')[0];
    };

    // --- DASHBOARD & EXPORT ---
    const showDashboard = () => { if (dashboardModal) dashboardModal.style.display = 'block'; renderCharts(); };
    const renderCharts = () => {
        const weeklyEl = document.getElementById('weekly-chart');
        const categoryEl = document.getElementById('category-chart');
        if (!weeklyEl || !categoryEl) return;
        const weeklyCtx = weeklyEl.getContext('2d');
        const weekData = getWeeklyCompletedData();
        if (typeof Chart !== 'undefined') {
            new Chart(weeklyCtx, { type: 'bar', data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Completed', data: weekData, backgroundColor: 'rgba(74, 144, 226, 0.6)' }] }, options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
            const categoryCtx = categoryEl.getContext('2d');
            const categoryData = getCategoryData();
            new Chart(categoryCtx, { type: 'pie', data: { labels: Object.keys(categoryData), datasets: [{ data: Object.values(categoryData), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }] } });
        }
    };
    const getWeeklyCompletedData = () => {
        const today = new Date(); const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        const data = [0, 0, 0, 0, 0, 0, 0];
        tasks.filter(task => task.completed && task.completedAt && new Date(task.completedAt) >= oneWeekAgo).forEach(task => {
            const day = new Date(task.completedAt).getDay();
            data[day === 0 ? 6 : day - 1]++;
        });
        return data;
    };
    const getCategoryData = () => {
        const data = {};
        tasks.forEach(task => { if (task.category) { data[task.category] = (data[task.category] || 0) + 1; } });
        return data;
    };
    const exportTasks = () => {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `tasks_${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
    };

    // --- KEYBOARD SHORTCUTS ---
    const setupKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); if (searchInput) searchInput.focus(); }
        });
    };

    // --- WEB NOTIFICATIONS ---
    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') { Notification.requestPermission(); }
    };
    const scheduleNotification = (task) => {
        if ('Notification' in window && Notification.permission === 'granted' && task && task.dueDate) {
            const dueDate = new Date(task.dueDate); const now = new Date();
            const timeUntilDue = dueDate - now;
            if (timeUntilDue > 0) {
                setTimeout(() => {
                    new Notification('Task Due Soon!', { body: `Task "${task.text}" is due today!`, icon: './favicon.ico' });
                }, Math.max(0, timeUntilDue - (60 * 60 * 1000)));
            }
        }
    };

    // --- SOCIAL FUNCTIONS ---
    const renderFriendsList = () => {
        if (friendRequestsList) friendRequestsList.innerHTML = '';
        if (!friendRequests || Object.keys(friendRequests).length === 0) {
            if (friendRequestsList) friendRequestsList.innerHTML = '<p>No pending requests.</p>';
        } else {
            Object.entries(friendRequests).forEach(([username, status]) => {
                if (status === 'received') {
                    const item = document.createElement('div'); item.className = 'request-item';
                    item.innerHTML = `<span>${username} wants to be your friend</span><div class="request-buttons"><button class="accept-btn" data-user="${username}">Accept</button><button class="decline-btn" data-user="${username}">Decline</button></div>`;
                    if (friendRequestsList) friendRequestsList.appendChild(item);
                }
            });
        }

        if (friendsList) friendsList.innerHTML = '';
        if (!friends || friends.length === 0) {
            if (friendsList) friendsList.innerHTML = '<p>No friends yet. Invite someone!</p>';
        } else {
            friends.forEach(friend => {
                const item = document.createElement('div'); item.className = 'friend-item';
                item.innerHTML = `<span>${friend}</span><div class="friend-buttons"><button class="remove-friend-btn" data-user="${friend}">Remove</button></div>`;
                if (friendsList) friendsList.appendChild(item);
            });
            renderFriendCheckboxes();
        }
    };
    const renderFriendCheckboxes = () => {
        if (!friendCheckboxesContainer) return;
        friendCheckboxesContainer.innerHTML = '';
        if (!friends || friends.length === 0) { friendCheckboxesContainer.innerHTML = '<p>You have no friends to share with.</p>'; }
        else { friends.forEach(friend => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="share-friend" value="${friend}"> ${friend}`;
            friendCheckboxesContainer.appendChild(label);
        }); }
    };
    const sendInvite = (e) => {
        e.preventDefault();
        const recipient = inviteUsernameInput ? inviteUsernameInput.value.trim() : '';
        if (!allUsers[recipient]) { alert(`User "${recipient}" does not exist.`); return; }
        if (recipient === currentUser) { alert('You cannot invite yourself.'); return; }
        if (friends.includes(recipient)) { alert(`You are already friends with ${recipient}.`); return; }
        const recipientRequests = JSON.parse(localStorage.getItem('friendRequests_' + recipient)) || {};
        recipientRequests[currentUser] = 'received';
        localStorage.setItem('friendRequests_' + recipient, JSON.stringify(recipientRequests));
        alert(`Friend request sent to ${recipient}!`); if (inviteForm) inviteForm.reset();
    };
    const handleFriendRequest = (e) => {
        const button = e.target;
        if (!button || !button.dataset) return;
        const action = button.classList && button.classList.contains('accept-btn');
        const fromUser = button.dataset.user;
        if (!fromUser) return;
        if (action) { friends.push(fromUser); saveFriends(); }
        delete friendRequests[fromUser]; saveFriendRequests();
        const senderFriends = JSON.parse(localStorage.getItem('friends_' + fromUser)) || [];
        if (action && !senderFriends.includes(currentUser)) {
            senderFriends.push(currentUser); localStorage.setItem('friends_' + fromUser, JSON.stringify(senderFriends));
        }
        const senderRequests = JSON.parse(localStorage.getItem('friendRequests_' + fromUser)) || {};
        delete senderRequests[currentUser]; localStorage.setItem('friendRequests_' + fromUser, JSON.stringify(senderRequests));
        renderFriendsList();
    };
    const removeFriend = (e) => {
        const friendToRemove = e.target ? e.target.dataset.user : null;
        if (!friendToRemove) return;
        friends = friends.filter(f => f !== friendToRemove); saveFriends();
        const otherUserFriends = JSON.parse(localStorage.getItem('friends_' + friendToRemove)) || [];
        const updatedOtherFriends = otherUserFriends.filter(f => f !== currentUser);
        localStorage.setItem('friends_' + friendToRemove, JSON.stringify(updatedOtherFriends));
        renderFriendsList();
    };
    
    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault(); const text = taskInput ? taskInput.value.trim() : '';
                if (text) {
                    const isShared = isSharedTaskCheckbox ? isSharedTaskCheckbox.checked : false; let sharedWith = [];
                    if (isShared) { const checkboxes = document.querySelectorAll('input[name="share-friend"]:checked'); sharedWith = Array.from(checkboxes).map(cb => cb.value); }
                    addTask(text, taskNotesInput ? taskNotesInput.value : '', taskDateInput ? taskDateInput.value : '', taskCategorySelect ? taskCategorySelect.value : '', taskPrioritySelect ? taskPrioritySelect.value : '', taskRecurrenceSelect ? taskRecurrenceSelect.value : '', isShared, sharedWith);
                    if (taskForm) taskForm.reset(); if (isSharedTaskCheckbox) isSharedTaskCheckbox.checked = false; if (friendSelectContainer) friendSelectContainer.style.display = 'none';
                }
            });
        }
        if (editTaskForm) {
            editTaskForm.addEventListener('submit', (e) => {
                e.preventDefault(); const idEl = document.getElementById('edit-task-id'); const id = idEl ? Number(idEl.value) : null;
                const isShared = isSharedTaskCheckbox ? isSharedTaskCheckbox.checked : false; let sharedWith = [];
                if (isShared) { const checkboxes = document.querySelectorAll('input[name="share-friend"]:checked'); sharedWith = Array.from(checkboxes).map(cb => cb.value); }
                const updatedData = {
                    text: (document.getElementById('edit-task-text') ? document.getElementById('edit-task-text').value : ''),
                    notes: (document.getElementById('edit-task-notes') ? document.getElementById('edit-task-notes').value : ''),
                    dueDate: (document.getElementById('edit-task-date') ? document.getElementById('edit-task-date').value : ''),
                    category: (document.getElementById('edit-task-category') ? document.getElementById('edit-task-category').value : ''),
                    priority: (document.getElementById('edit-task-priority') ? document.getElementById('edit-task-priority').value : ''),
                    isShared, sharedWith
                };
                if (id !== null) updateTask(id, updatedData); if (taskModal) taskModal.style.display = 'none';
            });
        }
        if (taskList) {
            taskList.addEventListener('click', (e) => {
                const target = e.target; const parentLi = target.closest('.task-item');
                if (!parentLi) return; const taskId = Number(parentLi.dataset.id);
                if (target.classList.contains('task-checkbox')) toggleTask(taskId);
                else if (target.classList.contains('delete-btn')) deleteTask(taskId);
                else if (target.closest('.edit-task-btn')) editTask(taskId);
            });
            taskList.addEventListener('dragstart', (e) => { if (e.target.classList.contains('task-item')) { draggedElement = e.target; e.target.classList.add('dragging'); } });
            taskList.addEventListener('dragend', (e) => { if (e.target.classList.contains('task-item')) { e.target.classList.remove('dragging'); } });
            taskList.addEventListener('dragover', (e) => { e.preventDefault(); const afterElement = getDragAfterElement(taskList, e.clientY); if (afterElement == null) { taskList.appendChild(draggedElement); } else { taskList.insertBefore(draggedElement, afterElement); } });
            taskList.addEventListener('drop', (e) => { e.preventDefault(); if (!draggedElement) return; const draggedId = Number(draggedElement.dataset.id); const allTasks = [...taskList.querySelectorAll('.task-item')]; const newIndex = allTasks.findIndex(item => item.dataset.id === draggedId.toString()); const oldIndex = tasks.findIndex(t => t.id === draggedId); if (oldIndex !== -1 && newIndex !== -1) { reorderTasks(oldIndex, newIndex); } });
        }
        if (searchInput) searchInput.addEventListener('input', renderTasks);
        if (statsBtn) statsBtn.addEventListener('click', showDashboard);
        if (exportBtn) exportBtn.addEventListener('click', exportTasks);
        if (closeBtns && closeBtns.length) closeBtns.forEach(btn => btn.addEventListener('click', () => { const modal = btn.closest('.modal'); if (modal) modal.style.display = 'none'; }));
        window.addEventListener('click', (e) => { if (e.target.classList && e.target.classList.contains('modal')) { e.target.style.display = 'none'; } });
        if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => addCategory(categoryInput ? categoryInput.value.trim() : ''));
        if (categoryInput) categoryInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCategory(categoryInput.value.trim()); });
        if (categoryListEl) categoryListEl.addEventListener('click', (e) => { if (e.target.classList.contains('remove-category')) { removeCategory(e.target.dataset.category); } });
        if (filterButtons && filterButtons.length) filterButtons.forEach(button => { button.addEventListener('click', () => { filterButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); currentFilter = button.dataset.filter; renderTasks(); }); });
        if (categoryFilterContainer) categoryFilterContainer.addEventListener('click', (e) => { if (e.target.classList && e.target.classList.contains('category-filter-btn')) { const btn = e.target; const category = btn.dataset.category; if (currentCategoryFilter === category) { currentCategoryFilter = null; btn.classList.remove('active'); } else { document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active')); currentCategoryFilter = category; btn.classList.add('active'); } renderTasks(); } });
        if (friendsBtn) friendsBtn.addEventListener('click', () => { if (friendsModal) friendsModal.style.display = 'block'; renderFriendsList(); });
        if (inviteForm) inviteForm.addEventListener('submit', sendInvite);
        if (friendRequestsList) friendRequestsList.addEventListener('click', handleFriendRequest);
        if (friendsList) friendsList.addEventListener('click', (e) => { if (e.target.classList && e.target.classList.contains('remove-friend-btn')) removeFriend(e); });
        if (isSharedTaskCheckbox) isSharedTaskCheckbox.addEventListener('change', (e) => { if (friendSelectContainer) friendSelectContainer.style.display = e.target.checked ? 'block' : 'none'; });
        setupKeyboardShortcuts();
    };

    // --- DRAG AND DROP HELPER ---
    const getDragAfterElement = (container, y) => {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; } else { return closest; }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };
    const addCategory = (name) => { if (name && !categories.includes(name)) { categories.push(name); saveCategories(); renderCategories(); } };
    const removeCategory = (name) => { if (name === 'General') return; categories = categories.filter(cat => cat !== name); tasks.forEach(task => { if (task.category === name) task.category = ''; }); saveCategories(); saveTasks(); renderCategories(); renderTasks(); };

    // --- Small helper added so editor doesn't flag undefined function ---
    function updateTaskCount() {
        if (!taskCount) return;
        const count = tasks.length;
        taskCount.textContent = count;
    }

}); // end DOMContentLoaded
