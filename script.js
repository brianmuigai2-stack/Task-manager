// script.js (module) - Firebase Auth + Firestore integrated + robust background video
// Make sure your HTML includes: <script type="module" src="script.js"></script>

/* ===========================
   Firebase imports (CDN modular SDK)
   =========================== */
   import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
   import {
     getAuth,
     createUserWithEmailAndPassword,
     signInWithEmailAndPassword,
     fetchSignInMethodsForEmail,
     setPersistence,
     browserLocalPersistence,
     signOut as fbSignOut,
     onAuthStateChanged
   } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
   import {
     getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, deleteField,
     collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, serverTimestamp
   } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
   
   /* ===========================
      Firebase config — keep your real config here
      =========================== */
   const firebaseConfig = {
     apiKey: "AIzaSyBZ6Of3Ow2lSX-8svE08kSXpdS67c1wVZA",
     authDomain: "task-manager-14ce4.firebaseapp.com",
     projectId: "task-manager-14ce4",
     storageBucket: "task-manager-14ce4.appspot.com",
     messagingSenderId: "770612132429",
     appId: "1:770612132429:web:e07578a974f55c7446fa04",
     measurementId: "G-ET1Z1WG3W5"
   };
   
   const app = initializeApp(firebaseConfig);
   const auth = getAuth(app);
   const db = getFirestore(app);
   
   /* Ensure Auth persistence so sign-in is remembered across browser sessions */
   setPersistence(auth, browserLocalPersistence).catch(err => {
     console.warn('setPersistence warning', err);
   });
   
   /* ===========================
      Helpers: normalize username & synthetic email
      =========================== */
   const normalizeUsername = (raw) => (raw || '').toString().trim().toLowerCase();
   const usernameToEmail = (normalizedUsername) => `${normalizedUsername}@taskmanager.local`;
   
   /* ===========================
      DOM: element getters (deferred)
      =========================== */
   const authModal = () => document.getElementById('auth-modal');
   const authForm = () => document.getElementById('auth-form');
   const authTitle = () => document.getElementById('auth-title');
   const authSubmitBtn = () => document.getElementById('auth-submit-btn');
   const showSignupLink = () => document.getElementById('show-signup');
   const appContainer = () => document.getElementById('app');
   const signOutBtn = () => document.getElementById('sign-out-btn');
   const currentUserDisplay = () => document.getElementById('current-user-display');
   
   const taskForm = () => document.getElementById('task-form');
   const taskInput = () => document.getElementById('task-input');
   const taskNotesInput = () => document.getElementById('task-notes');
   const taskDateInput = () => document.getElementById('task-date');
   const taskCategorySelect = () => document.getElementById('task-category');
   const taskPrioritySelect = () => document.getElementById('task-priority');
   const taskRecurrenceSelect = () => document.getElementById('task-recurrence');
   const taskList = () => document.getElementById('task-list');
   const filterButtons = () => document.querySelectorAll('.filter-btn');
   const categoryFilterContainer = () => document.getElementById('category-filter-buttons');
   const taskCountEl = () => document.getElementById('task-count');
   const categoryInput = () => document.getElementById('category-input');
   const addCategoryBtn = () => document.getElementById('add-category-btn');
   const categoryListEl = () => document.getElementById('category-list');
   const searchInput = () => document.getElementById('search-input');
   const statsBtn = () => document.getElementById('stats-btn');
   const exportBtn = () => document.getElementById('export-btn');
   const taskModal = () => document.getElementById('task-modal');
   const editTaskForm = () => document.getElementById('edit-task-form');
   const dashboardModal = () => document.getElementById('dashboard-modal');
   const closeBtns = () => document.querySelectorAll('.close-btn');
   const friendsBtn = () => document.getElementById('friends-btn');
   const friendsModal = () => document.getElementById('friends-modal');
   const inviteForm = () => document.getElementById('invite-form');
   const inviteUsernameInput = () => document.getElementById('invite-username');
   const friendRequestsList = () => document.getElementById('friend-requests-list');
   const friendsList = () => document.getElementById('friends-list');
   const isSharedTaskCheckbox = () => document.getElementById('is-shared-task');
   const friendSelectContainer = () => document.getElementById('friend-select-container');
   const friendCheckboxesContainer = () => document.getElementById('friend-checkboxes');
   const bgVideoEl = () => document.getElementById('bg-video');
   const bgTitleEl = () => document.getElementById('bg-title');
   const bgPrevBtn = () => document.getElementById('bg-prev-btn');
   const bgNextBtn = () => document.getElementById('bg-next-btn');
   
   /* ===========================
      App state
      =========================== */
   let currentUser = null; // now: auth uid
   let currentUserDisplayName = '';
   let unsubscribeTasksListener = null;
   let localCategories = ['General']; // Will be loaded from Firestore
   let statsPieChart = null; // <-- Global variable for the chart instance
   
   // simple cache for uid -> displayName to avoid repeated reads
   const displayNameCache = new Map();
   
   /* ===========================
      Utility: escape HTML
      =========================== */
   function escapeHtml(text) {
     if (!text && text !== 0) return '';
     return String(text)
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
   }
   
   /* ===========================
      Firestore: user helpers (UID-based)
      =========================== */
   async function createUserFirestore(uid, normalizedUsername, displayName) {
     // create users/{uid} and usernames/{normalizedUsername} => { uid }
     const userRef = doc(db, 'users', uid);
     const usernameRef = doc(db, 'usernames', normalizedUsername);
     const snap = await getDoc(userRef);
     if (snap.exists()) return { ok: false, reason: 'exists' };
     try {
       await setDoc(userRef, {
         username: normalizedUsername,
         displayName: displayName || normalizedUsername,
         createdAt: serverTimestamp(),
         friends: [],              // store friends as array of uids
         friendRequests: {},       // map of uid -> status
         categories: ['General']
       });
       // create username mapping to uid for lookups
       await setDoc(usernameRef, { uid });
       return { ok: true };
     } catch (err) {
       console.error('createUserFirestore error', err);
       return { ok: false, error: err };
     }
   }
   
   async function getUserDoc(uid) {
     if (!uid) return null;
     try {
       const userRef = doc(db, 'users', uid);
       const snap = await getDoc(userRef);
       return snap.exists() ? snap.data() : null;
     } catch (err) {
       console.error('getUserDoc error', err);
       return null;
     }
   }
   
   async function getUidForUsername(normalizedUsername) {
     if (!normalizedUsername) return null;
     try {
       const ref = doc(db, 'usernames', normalizedUsername);
       const snap = await getDoc(ref);
       if (!snap.exists()) return null;
       const d = snap.data();
       return d && d.uid ? d.uid : null;
     } catch (err) {
       console.error('getUidForUsername error', err);
       return null;
     }
   }
   
   async function getDisplayNameForUid(uid) {
     if (!uid) return uid;
     if (displayNameCache.has(uid)) return displayNameCache.get(uid);
     const udoc = await getUserDoc(uid);
     const name = (udoc && (udoc.displayName || udoc.username)) ? (udoc.displayName || udoc.username) : uid;
     displayNameCache.set(uid, name);
     return name;
   }
   
   /* ===========================
      ADDED: Category Management Functions
      =========================== */
   
   // Renders categories in all relevant dropdowns
   function renderCategories() {
     const mainSelect = taskCategorySelect();
     const editSelect = document.getElementById('edit-task-category');
   
     if (mainSelect) {
       mainSelect.innerHTML = ''; // Clear existing options
       const emptyOpt = document.createElement('option');
       emptyOpt.value = '';
       emptyOpt.textContent = 'No Category';
       mainSelect.appendChild(emptyOpt);
       localCategories.forEach(cat => {
         const option = document.createElement('option');
         option.value = cat;
         option.textContent = cat;
         mainSelect.appendChild(option);
       });
     }
   
     if (editSelect) {
       editSelect.innerHTML = ''; // Clear existing options
       const emptyOpt = document.createElement('option');
       emptyOpt.value = '';
       emptyOpt.textContent = 'No Category';
       editSelect.appendChild(emptyOpt);
       localCategories.forEach(cat => {
         const option = document.createElement('option');
         option.value = cat;
         option.textContent = cat;
         editSelect.appendChild(option);
       });
     }
   }
   
   // Handles the logic for adding a new category
   async function handleAddCategory() {
     const input = categoryInput();
     if (!input) return;
     const newCategoryRaw = input.value.trim();
   
     if (!newCategoryRaw) {
       alert('Please enter a category name.');
       return;
     }
   
     // Capitalize the first letter for display and normalize for storage
     const displayCategory = newCategoryRaw.charAt(0).toUpperCase() + newCategoryRaw.slice(1);
   
     if (localCategories.includes(displayCategory)) {
       alert('This category already exists.');
       return;
     }
   
     // Add to local state and UI
     localCategories.push(displayCategory);
     renderCategories();
   
     // Save to Firestore (best-effort)
     try {
       const userRef = doc(db, 'users', currentUser);
       await updateDoc(userRef, { categories: localCategories });
       console.log('Category saved to Firestore.');
     } catch (error) {
       console.error('Error saving category:', error);
       // don't block user if save fails
     }
   
     // Clear the input field
     input.value = '';
   }
   
   /* ===========================
      UPDATED: Function to create a larger set of varied sample tasks for a new user
      =========================== */
   async function createSampleTasksForUser(uid, displayName) {
     console.log(`Creating sample tasks for user (uid=${uid}, name=${displayName})`);
     const tasksCollection = collection(db, 'tasks');
     const now = new Date();
     const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
     const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
     const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
   
     const sampleTasks = [
       { ownerId: uid, ownerName: displayName || uid, text: "Review project proposal", notes: "Check for typos and budget clarity.", category: "Work", priority: "high", completed: false, createdAt: serverTimestamp() },
       { ownerId: uid, ownerName: displayName || uid, text: "Prepare slides for Monday's meeting", notes: "Focus on Q3 results.", dueDate: tomorrow, category: "Work", priority: "high", completed: false, createdAt: serverTimestamp() },
       { ownerId: uid, ownerName: displayName || uid, text: "Plan weekend trip to the mountains", notes: "Book a hotel and research hiking trails.", dueDate: nextWeek, category: "Personal", priority: "low", completed: false, createdAt: serverTimestamp() },
       { ownerId: uid, ownerName: displayName || uid, text: "Pay monthly bills", notes: "Electricity, internet, and credit card.", dueDate: tomorrow, category: "Finance", priority: "high", completed: false, createdAt: serverTimestamp() }
     ];
   
     try {
       await Promise.all(sampleTasks.map(taskData => addDoc(tasksCollection, taskData)));
       console.log("Sample tasks created successfully.");
     } catch (error) {
       console.error("Error creating sample tasks:", error);
     }
   }
   
   /* ===========================
      ADDED: Function to ensure user has sample tasks
      =========================== */
   async function ensureUserHasSampleTasks(uid, displayName) {
     try {
       const tasksCollection = collection(db, 'tasks');
       const qOwned = query(tasksCollection, where('ownerId', '==', uid));
       const snapshot = await getDocs(qOwned);
       
       // If user has no tasks, create sample tasks
       if (snapshot.empty) {
         console.log("User has no tasks, creating sample tasks...");
         await createSampleTasksForUser(uid, displayName);
       }
     } catch (error) {
       console.error("Error checking user tasks:", error);
     }
   }
   
   /* ===========================
      Tasks: listener and renderer
      =========================== */
   function startTasksListener() {
     if (typeof unsubscribeTasksListener === 'function') {
       try { unsubscribeTasksListener(); } catch (e) {}
       unsubscribeTasksListener = null;
     }
     const tl = taskList();
     if (!tl || !currentUser) return;
   
     const tasksCollection = collection(db, 'tasks');
     // Owned tasks (ownerId is uid now)
     const qOwned = query(tasksCollection, where('ownerId', '==', currentUser), orderBy('createdAt', 'desc'));
     const qShared = query(tasksCollection, where('sharedWith', 'array-contains', currentUser), orderBy('createdAt', 'desc'));
   
     const tasksMap = new Map();
   
     const unsub1 = onSnapshot(qOwned, (snap) => {
       snap.forEach(d => tasksMap.set(d.id, { id: d.id, ...d.data() }));
       renderTasksFromMap(tasksMap);
     }, (err) => console.warn('Tasks owned listener error', err));
   
     const unsub2 = onSnapshot(qShared, (snap) => {
       snap.forEach(d => tasksMap.set(d.id, { id: d.id, ...d.data() }));
       renderTasksFromMap(tasksMap);
     }, (err) => console.warn('Tasks shared listener error', err));
   
     unsubscribeTasksListener = () => {
       try { unsub1(); } catch (e) {}
       try { unsub2(); } catch (e) {}
     };
   }
   
   // ENHANCED: Added logging to help debug missing tasks
   function renderTasksFromMap(tasksMap) {
     const tl = taskList();
     if (!tl) return;
     tl.innerHTML = '';
     const arr = Array.from(tasksMap.values()).sort((a, b) => {
       const ta = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : 0;
       const tb = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : 0;
       return tb - ta;
     });
     arr.forEach(task => {
       const li = createTaskElement(task);
       tl.appendChild(li);
     });
     updateTaskCountUI();
   }
   
   function createTaskElement(task) {
     const li = document.createElement('li');
     const isOwner = task.ownerId === currentUser;
     li.className = `task-item priority-${task.priority || 'medium'} ${!isOwner ? 'shared-task' : ''}`;
     li.dataset.id = task.id;
     li.draggable = Boolean(isOwner);
   
     const dueDateStr = task.dueDate || '';
     li.innerHTML = `
       <div class="task-main-content">
         <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} ${!isOwner ? 'disabled' : ''} aria-label="Toggle task completion"/>
         <div class="task-content">
           <span class="task-text">${escapeHtml(task.text)}</span>
           ${task.notes ? `<div class="task-notes">${escapeHtml(task.notes)}</div>` : ''}
         </div>
         <div class="task-meta">
           ${!isOwner ? `<span class="shared-task-indicator">Shared by ${escapeHtml(task.ownerName || task.ownerId)}</span>` : ''}
           <span class="task-priority">${escapeHtml(task.priority || '')}</span>
           ${task.category ? `<span class="task-category-tag">${escapeHtml(task.category)}</span>` : ''}
           ${dueDateStr ? `<span class="task-due-date">${escapeHtml(dueDateStr)}</span>` : ''}
           ${isOwner ? `<button class="edit-task-btn" title="Edit Task"><i class="fas fa-edit" aria-hidden="true"></i></button>` : ''}
           ${isOwner ? `<button class="delete-btn" title="Delete Task" aria-label="Delete task">&times;</button>` : ''}
         </div>
       </div>
     `;
     return li;
   }
   
   function updateTaskCountUI() {
     const el = taskCountEl();
     if (!el) return;
     const items = document.querySelectorAll('#task-list .task-item');
     let left = 0;
     items.forEach(node => {
       const cb = node.querySelector('.task-checkbox');
       if (cb && !cb.checked) left++;
     });
     el.textContent = `${left} tasks left`;
   }
   
   /* ===========================
      CRUD: tasks (remote)
      =========================== */
   async function addTaskRemote({ text, notes, dueDate, category, priority, recurrence, isShared, sharedWith }) {
     if (!currentUser) throw new Error('not signed in');
     try {
       const docRef = await addDoc(collection(db, 'tasks'), {
         ownerId: currentUser,
         ownerName: currentUserDisplayName || currentUser,
         text: text || '',
         notes: notes || '',
         dueDate: dueDate || '',
         category: category || '',
         priority: priority || 'medium',
         recurrence: recurrence || '',
         isShared: Boolean(isShared),
         sharedWith: sharedWith || [],
         completed: false,
         createdAt: serverTimestamp()
       });
       return { ok: true, id: docRef.id };
     } catch (err) {
       console.error('addTaskRemote error', err);
       return { ok: false, error: err };
     }
   }
   
   async function updateTaskRemote(id, updates) {
     try {
       const tRef = doc(db, 'tasks', id);
       if ('completed' in updates && updates.completed) updates.completedAt = serverTimestamp();
       await updateDoc(tRef, updates);
       return { ok: true };
     } catch (err) {
       console.error('updateTaskRemote error', err);
       return { ok: false, error: err };
     }
   }
   
   async function deleteTaskRemote(id) {
     try {
       const tRef = doc(db, 'tasks', id);
       await deleteDoc(tRef);
       return { ok: true };
     } catch (err) {
       console.error('deleteTaskRemote error', err);
       return { ok: false, error: err };
     }
   }
   
   /* ===========================
      Friends / invites (now username->uid mapping aware)
      =========================== */
   async function sendInviteRemote(recipientRaw) {
     const candidate = normalizeUsername(recipientRaw);
     if (!candidate) throw new Error('no recipient');
     // lookup uid for username
     const recipientUid = await getUidForUsername(candidate);
     if (!recipientUid) return { ok: false, reason: 'notfound' };
     if (recipientUid === currentUser) return { ok: false, reason: 'self' };
   
     try {
       const recipientRef = doc(db, 'users', recipientUid);
       // Use UID keys in friendRequests map
       await updateDoc(recipientRef, { [`friendRequests.${currentUser}`]: 'received' });
       return { ok: true };
     } catch (err) {
       console.error('sendInviteRemote error', err);
       return { ok: false, error: err };
     }
   }
   
   async function acceptInviteRemote(fromUid) {
     try {
       const meRef = doc(db, 'users', currentUser);
       const senderRef = doc(db, 'users', fromUid);
       // add each other by uid in friends arrays, remove request
       await updateDoc(meRef, { friends: arrayUnion(fromUid), [`friendRequests.${fromUid}`]: deleteField() });
       await updateDoc(senderRef, { friends: arrayUnion(currentUser) });
       return { ok: true };
     } catch (err) {
       console.error('acceptInviteRemote error', err);
       return { ok: false, error: err };
     }
   }
   
   async function declineInviteRemote(fromUid) {
     try {
       const meRef = doc(db, 'users', currentUser);
       await updateDoc(meRef, { [`friendRequests.${fromUid}`]: deleteField() });
       return { ok: true };
     } catch (err) {
       console.error('declineInviteRemote error', err);
       return { ok: false, error: err };
     }
   }
   
   /* ===========================
      UI render helpers: friends (now asynchronous because UIDs are resolved)
      =========================== */
   async function renderFriendRequests(requestsMap) {
     const el = friendRequestsList();
     if (!el) return;
     el.innerHTML = '';
     const entries = Object.entries(requestsMap || {});
     if (entries.length === 0) {
       el.innerHTML = '<p>No pending requests.</p>';
       return;
     }
   
     // entries are [uid, status]
     for (const [fromUid, status] of entries) {
       if (status === 'received') {
         const display = await getDisplayNameForUid(fromUid);
         const item = document.createElement('div');
         item.className = 'request-item';
         item.innerHTML = `<span>${escapeHtml(display)} wants to be your friend</span>
           <div class="request-buttons">
             <button class="accept-btn" data-user="${escapeHtml(fromUid)}">Accept</button>
             <button class="decline-btn" data-user="${escapeHtml(fromUid)}">Decline</button>
           </div>`;
         el.appendChild(item);
       }
     }
   }
   
   async function renderFriendsListUI(friendsArr) {
     const el = friendsList();
     if (!el) return;
     el.innerHTML = '';
     if (!Array.isArray(friendsArr) || friendsArr.length === 0) {
       el.innerHTML = '<p>No friends yet. Invite someone!</p>';
       renderFriendCheckboxesUI([]);
       return;
     }
   
     // friendsArr is array of uids — resolve each to display name
     for (const uid of friendsArr) {
       const name = await getDisplayNameForUid(uid);
       const item = document.createElement('div');
       item.className = 'friend-item';
       item.innerHTML = `<span>${escapeHtml(name)}</span> <button class="remove-friend-btn" data-user="${escapeHtml(uid)}">Remove</button>`;
       el.appendChild(item);
     }
     renderFriendCheckboxesUI(friendsArr);
   }
   
   function renderFriendCheckboxesUI(friendsArr) {
     const c = friendCheckboxesContainer();
     if (!c) return;
     c.innerHTML = '';
     if (!Array.isArray(friendsArr) || friendsArr.length === 0) {
       c.innerHTML = '<p>You have no friends to share with.</p>';
       return;
     }
     friendsArr.forEach(f => {
       const label = document.createElement('label');
       // value is uid
       label.innerHTML = `<input type="checkbox" name="share-friend" value="${escapeHtml(f)}"> ${escapeHtml(displayNameCache.get(f) || f)}`;
       c.appendChild(label);
     });
   }
   
   /* ===========================
      Auth UI flows + helpers (signup changed to use uid)
      =========================== */
   function showAppUI() {
     const authM = authModal();
     const appC = appContainer();
     const display = currentUserDisplay();
     if (authM) authM.style.display = 'none';
     if (appC) appC.style.display = 'flex';
     if (display) display.textContent = currentUserDisplayName || currentUser || '';
     startTasksListener();
     // load user data (await in caller)
     loadAndRenderUserData();
   }
   
   function showAuthUI() {
     if (authModal()) authModal().style.display = 'flex';
     if (appContainer()) appContainer().style.display = 'none';
     if (typeof unsubscribeTasksListener === 'function') {
       try { unsubscribeTasksListener(); } catch (e) {}
       unsubscribeTasksListener = null;
     }
   }
   
   // Loads user document and renders categories/friends
   async function loadAndRenderUserData() {
     if (!currentUser) return;
     try {
       const udoc = await getUserDoc(currentUser);
       if (udoc) {
         currentUserDisplayName = udoc.displayName || udoc.username || currentUser;
   
         if (udoc.categories && Array.isArray(udoc.categories)) {
           const mergedCategories = ['General', ...udoc.categories.filter(cat => cat !== 'General')];
           localCategories = [...new Set(mergedCategories)];
         } else {
           localCategories = ['General'];
         }
         renderCategories();
   
         // Ensure user has sample tasks
         await ensureUserHasSampleTasks(currentUser, currentUserDisplayName);
   
         // render friend requests and friends (async)
         await renderFriendRequests(udoc.friendRequests || {});
         await renderFriendsListUI(udoc.friends || []);
       } else {
         console.error("User document not found:", currentUser);
       }
     } catch (err) {
       console.error('loadAndRenderUserData error', err);
     }
   }
   
   /* ===========================
      UPDATED: Stats functionality with Pie Chart
      =========================== */
   async function calculateAndShowStats() {
     if (!currentUser) {
       console.warn("Cannot calculate stats: No current user.");
       return;
     }
   
     const tasksCollection = collection(db, 'tasks');
     const qOwned = query(tasksCollection, where('ownerId', '==', currentUser), orderBy('createdAt', 'desc'));
     const qShared = query(tasksCollection, where('sharedWith', 'array-contains', currentUser), orderBy('createdAt', 'desc'));
   
     const categoryCounts = {};
     try {
       const ownedSnapshot = await getDocs(qOwned);
       ownedSnapshot.forEach(d => {
         const task = d.data();
         const category = task.category || 'Uncategorized';
         categoryCounts[category] = (categoryCounts[category] || 0) + 1;
       });
   
       const sharedSnapshot = await getDocs(qShared);
       sharedSnapshot.forEach(d => {
         const task = d.data();
         const category = task.category || 'Uncategorized';
         categoryCounts[category] = (categoryCounts[category] || 0) + 1;
       });
   
       const labels = Object.keys(categoryCounts);
       const data = Object.values(categoryCounts);
   
       const backgroundColors = [
         'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)',
         'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)',
         'rgba(255, 99, 255, 0.7)', 'rgba(99, 255, 132, 0.7)',
       ];
   
       const canvas = document.getElementById('stats-pie-chart');
       if (!canvas) return;
       const ctx = canvas.getContext('2d');
       if (statsPieChart) statsPieChart.destroy();
   
       statsPieChart = new Chart(ctx, {
         type: 'pie', data: {
           labels: labels, datasets: [{
             label: 'Tasks by Category', data: data,
             backgroundColor: backgroundColors.slice(0, data.length), borderColor: '#fff', borderWidth: 2
           }]
         }, options: {
           responsive: true, maintainAspectRatio: false, plugins: {
             legend: { position: 'top', }, tooltip: {
               callbacks: {
                 label: function(context) {
                   let label = context.label || ''; if (label) label += ': ';
                   if (context.parsed !== null) label += context.parsed + ' tasks';
                   return label;
                 }
               }
             }
           }
         }
       });
   
       if (dashboardModal()) dashboardModal().style.display = 'block';
     } catch (error) {
       console.error("Error calculating stats:", error);
       alert("Could not load statistics.");
     }
   }
   
   /* ===========================
      Utilities: debounce
      =========================== */
   function debounce(fn, ms = 250) {
     let t;
     return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
   }
   
   /* ===========================
      Event wiring (DOMContentLoaded) - consolidated
      =========================== */
   document.addEventListener('DOMContentLoaded', () => {
     // Register UI handlers
     const authFormEl = authForm();
     if (authFormEl) {
       authFormEl.addEventListener('submit', async (e) => {
         e.preventDefault();
         const usernameRaw = (document.getElementById('auth-username') || {}).value || '';
         const password = (document.getElementById('auth-password') || {}).value || '';
         if (!usernameRaw || !password) { alert('Enter username & password'); return; }
         const normalized = normalizeUsername(usernameRaw);
         const syntheticEmail = usernameToEmail(normalized);
   
         const isSigningUp = (authTitle() && authTitle().textContent && authTitle().textContent.toLowerCase().includes('sign up')) || false;
   
         if (isSigningUp) {
           try {
             const methods = await fetchSignInMethodsForEmail(auth, syntheticEmail);
             if (Array.isArray(methods) && methods.length > 0) {
               if (methods.includes('password')) {
                 const trySignIn = confirm(`Username "${normalized}" is already taken. Do you want to try signing in with that username now?`);
                 if (trySignIn) {
                   await signInWithEmailAndPassword(auth, syntheticEmail, password);
                   return;
                 } else { return; }
               } else {
                 alert(`Username "${normalized}" is already taken (different sign-in method). Please choose another username.`);
                 return;
               }
             }
   
             // 1. Create the user in Firebase Auth and get uid
             const userCredential = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
             const uid = userCredential.user.uid;
   
             // 2. Create the user's document in Firestore under users/{uid} and usernames/{normalized}
             const created = await createUserFirestore(uid, normalized, usernameRaw);
             if (!created.ok) {
               console.error('Failed to create user doc', created);
               alert('Signup failed while creating profile.');
               return;
             }
   
             // 3. Create the sample tasks (moved here to avoid race conditions)
             await createSampleTasksForUser(uid, usernameRaw);
   
             // onAuthStateChanged will handle showing the UI
             console.log("Signup successful. Awaiting onAuthStateChanged trigger.");
   
           } catch (err) {
             console.error('signup error', err);
             alert('Signup failed: ' + (err.code || err.message || err));
           }
         } else {
           // sign-in flow
           try {
             await signInWithEmailAndPassword(auth, syntheticEmail, password);
           } catch (err) {
             console.error('signin error', err);
             alert('Sign in failed: Invalid username or password.');
           }
         }
       });
     }
   
     // toggle show-signup / show-signin anchors (delegated)
     document.body.addEventListener('click', (e) => {
       const el = e.target;
       if (!el) return;
       if (el.id === 'show-signup') {
         e.preventDefault();
         if (authTitle()) authTitle().textContent = 'Sign Up';
         if (authSubmitBtn()) authSubmitBtn().textContent = 'Sign Up';
         el.innerHTML = "Already have an account? <a href=\"#\" id=\"show-signin\">Sign In</a>";
         return;
       }
       if (el.id === 'show-signin') {
         e.preventDefault();
         if (authTitle()) authTitle().textContent = 'Sign In';
         if (authSubmitBtn()) authSubmitBtn().textContent = 'Sign In';
         el.innerHTML = "Don't have an account? <a href=\"#\" id=\"show-signup\">Sign Up</a>";
         return;
       }
     });
   
     // sign out
     const signOutBtnEl = signOutBtn();
     if (signOutBtnEl) {
       signOutBtnEl.addEventListener('click', async () => {
         try {
           await fbSignOut(auth);
           currentUser = null; currentUserDisplayName = '';
           showAuthUI();
         } catch (err) { console.warn('signout error', err); }
       });
     }
   
     // add task
     const taskFormEl = taskForm();
     if (taskFormEl) {
       taskFormEl.addEventListener('submit', async (e) => {
         e.preventDefault();
         if (!currentUser) { alert('Sign in first'); return; }
         const text = taskInput() ? taskInput().value.trim() : '';
         if (!text) return;
         const notes = taskNotesInput() ? taskNotesInput().value : '';
         const dueDate = taskDateInput() ? taskDateInput().value : '';
         const category = taskCategorySelect() ? taskCategorySelect().value : '';
         const priority = taskPrioritySelect() ? taskPrioritySelect().value : 'medium';
         const isShared = isSharedTaskCheckbox() ? isSharedTaskCheckbox().checked : false;
         let sharedWith = [];
         if (isShared) {
           const boxes = document.querySelectorAll('input[name="share-friend"]:checked');
           sharedWith = Array.from(boxes).map(b => b.value);
         }
         try {
           const res = await addTaskRemote({ text, notes, dueDate, category, priority, isShared, sharedWith });
           if (!res.ok) throw res.error || new Error('Add failed');
           if (taskFormEl) taskFormEl.reset();
           if (friendSelectContainer()) friendSelectContainer().style.display = 'none';
         } catch (err) { console.error('add task error', err); alert('Add task failed'); }
       });
     }
   
     // add category button
     const addCategoryBtnEl = addCategoryBtn();
     if (addCategoryBtnEl) {
       addCategoryBtnEl.addEventListener('click', handleAddCategory);
     }
   
     // task list click (toggle, edit, delete)
     const tl = taskList();
     if (tl) {
       tl.addEventListener('click', async (e) => {
         const t = e.target;
         const parent = t.closest('.task-item');
         if (!parent) return;
         const id = parent.dataset.id;
         if (t.classList.contains('task-checkbox')) {
           const checkbox = t;
           try {
             await updateTaskRemote(id, { completed: checkbox.checked });
           } catch (err) { console.warn('toggle error', err); }
         } else if (t.classList.contains('delete-btn')) {
           if (!confirm('Delete this task?')) return;
           try {
             await deleteTaskRemote(id);
           } catch (err) { console.warn('delete error', err); }
         } else if (t.closest('.edit-task-btn')) {
           try {
             const docRef = doc(db, 'tasks', id);
             const snap = await getDoc(docRef);
             if (!snap.exists()) return;
             const task = snap.data();
             if (document.getElementById('edit-task-text')) document.getElementById('edit-task-text').value = task.text || '';
             if (document.getElementById('edit-task-notes')) document.getElementById('edit-task-notes').value = task.notes || '';
             if (document.getElementById('edit-task-date')) document.getElementById('edit-task-date').value = task.dueDate || '';
             if (document.getElementById('edit-task-category')) document.getElementById('edit-task-category').value = task.category || '';
             if (document.getElementById('edit-task-priority')) document.getElementById('edit-task-priority').value = task.priority || 'medium';
             if (document.getElementById('edit-task-id')) document.getElementById('edit-task-id').value = id;
             if (taskModal()) taskModal().style.display = 'flex';
             // focus the first input in the modal for accessibility
             setTimeout(() => {
               const first = document.getElementById('edit-task-text');
               if (first) first.focus();
             }, 50);
           } catch (err) { console.warn('edit open error', err); }
         }
       });
     }
   
     // edit submit
     const editForm = editTaskForm();
     if (editForm) {
       editForm.addEventListener('submit', async (e) => {
         e.preventDefault();
         const id = (document.getElementById('edit-task-id') || {}).value;
         const updated = {
           text: (document.getElementById('edit-task-text') || {}).value || '',
           notes: (document.getElementById('edit-task-notes') || {}).value || '',
           dueDate: (document.getElementById('edit-task-date') || {}).value || '',
           category: (document.getElementById('edit-task-category') || {}).value || '',
           priority: (document.getElementById('edit-task-priority') || {}).value || 'medium'
         };
         try {
           if (id) {
             const res = await updateTaskRemote(String(id), updated);
             if (!res.ok) throw res.error || new Error('Update failed');
           }
           if (taskModal()) taskModal().style.display = 'none';
         } catch (err) { console.warn('update task error', err); alert('Update failed'); }
       });
     }
   
     // friends modal open
     const friendsBtnEl = friendsBtn();
     if (friendsBtnEl) friendsBtnEl.addEventListener('click', () => { if (friendsModal()) friendsModal().style.display = 'block'; });
   
     // invite form
     const inviteFormEl = inviteForm();
     if (inviteFormEl) {
       inviteFormEl.addEventListener('submit', async (e) => {
         e.preventDefault();
         const recipientRaw = inviteUsernameInput() ? inviteUsernameInput().value.trim() : '';
         if (!recipientRaw) return alert('Enter a username to invite.');
         try {
           const res = await sendInviteRemote(recipientRaw);
           if (!res.ok) {
             if (res.reason === 'notfound') alert('That user does not exist.');
             else if (res.reason === 'self') alert('Cannot invite yourself.');
             else alert('Invite failed.');
           } else {
             alert(`Friend request sent to ${recipientRaw}!`);
             if (inviteFormEl) inviteFormEl.reset();
           }
         } catch (err) {
           console.error('invite error', err);
           alert('Invite failed: ' + err.message);
         }
       });
     }
   
     // friend request click (accept / decline)
     const frList = friendRequestsList();
     if (frList) {
       frList.addEventListener('click', async (e) => {
         const btn = e.target;
         if (!btn || !btn.dataset) return;
         const fromUid = btn.dataset.user;
         if (!fromUid) return;
         if (btn.classList.contains('accept-btn')) {
           try { await acceptInviteRemote(fromUid); await loadAndRenderUserData(); }
           catch (err) { console.warn('accept invite error', err); }
         } else if (btn.classList.contains('decline-btn')) {
           try { await declineInviteRemote(fromUid); await loadAndRenderUserData(); }
           catch (err) { console.warn('decline invite error', err); }
         }
       });
     }
   
     // friends list remove friend
     const frs = friendsList();
     if (frs) {
       frs.addEventListener('click', async (e) => {
         const btn = e.target;
         if (!btn || !btn.dataset) return;
         if (btn.classList.contains('remove-friend-btn')) {
           const friendToRemove = btn.dataset.user; // this is uid
           try {
             const meRef = doc(db, 'users', currentUser);
             const otherRef = doc(db, 'users', friendToRemove);
             await updateDoc(meRef, { friends: arrayRemove(friendToRemove) });
             await updateDoc(otherRef, { friends: arrayRemove(currentUser) });
             await loadAndRenderUserData();
           } catch (err) { console.warn('remove friend error', err); }
         }
       });
     }
   
     // close modal buttons
     const closeButtons = closeBtns();
     if (closeButtons && closeButtons.length) {
       closeButtons.forEach(btn => btn.addEventListener('click', () => { const modal = btn.closest('.modal'); if (modal) modal.style.display = 'none'; }));
     }
   
     // click outside modal to close
     window.addEventListener('click', (e) => { if (e.target && e.target.classList && e.target.classList.contains('modal')) e.target.style.display = 'none'; });
   
     // escape to close modals
     document.addEventListener('keydown', (e) => {
       if (e.key === 'Escape') {
         const openModals = document.querySelectorAll('.modal[style*="display: block"], .modal[style*="display: flex"]');
         openModals.forEach(m => m.style.display = 'none');
       }
       // search shortcut
       if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); if (searchInput()) searchInput().focus(); }
     });
   
     // search input debounced handler (filtering is client-side in this build)
     const sInput = searchInput();
     if (sInput) {
       const doFilter = debounce(() => {
         const q = (sInput.value || '').toLowerCase().trim();
         document.querySelectorAll('#task-list .task-item').forEach(li => {
           const txt = (li.querySelector('.task-text') || {}).textContent || '';
           const notes = (li.querySelector('.task-notes') || {}).textContent || '';
           const matches = txt.toLowerCase().includes(q) || notes.toLowerCase().includes(q);
           li.style.display = matches ? '' : 'none';
         });
       }, 200);
       sInput.addEventListener('input', doFilter);
     }
   
     // Stats button event listener (async)
     const statsBtnEl = statsBtn();
     if (statsBtnEl) {
       statsBtnEl.addEventListener('click', async () => {
         await calculateAndShowStats();
       });
     }
   
     // Video background controls & initialization
     const bgPrevBtnEl = bgPrevBtn();
     const bgNextBtnEl = bgNextBtn();
     if (bgPrevBtnEl) bgPrevBtnEl.addEventListener('click', (e) => { e.preventDefault(); setVideoSource(currentVideoIndex - 1); });
     if (bgNextBtnEl) bgNextBtnEl.addEventListener('click', (e) => { e.preventDefault(); setVideoSource(currentVideoIndex + 1); });
   
     // Initialize video on ready (small delay so DOM is fully painted)
     setTimeout(() => {
       try { setVideoSource(0); } catch (err) { console.warn('setVideoSource init error', err); }
     }, 50);
   }); // end DOMContentLoaded
   
   /* ===========================
      Auth state listener (currentUser is uid)
      =========================== */
   onAuthStateChanged(auth, async (user) => {
     if (user) {
       const uid = user.uid;
       currentUser = uid;
       try {
         const udoc = await getUserDoc(currentUser);
         currentUserDisplayName = (udoc && udoc.displayName) ? udoc.displayName : (udoc && udoc.username) ? udoc.username : currentUser;
         // cache display name
         displayNameCache.set(currentUser, currentUserDisplayName);
         showAppUI();
       } catch (err) {
         console.error('onAuthStateChanged load user error', err);
         showAuthUI();
       }
     } else {
       currentUser = null;
       currentUserDisplayName = '';
       showAuthUI();
     }
   });
   
   /* ===========================
      Robust background video + CSS slides
      =========================== */
   
   const videoSources = [
     { title: 'Productive Workspace', url: './videos/task-background.mp4', fallbackCss: 'linear-gradient(-45deg,#111,#333)' },
     { title: 'Just a video', url: './videos/background-1.mp4', fallbackCss: 'linear-gradient(-45deg,#222,#444)' },
     { title: 'Tech Data Flow', url: './videos/background-2.mp4', fallbackCss: 'linear-gradient(-45deg,#0f172a,#0b3a5b)' },
     { title: 'Abstract Particles', url: './videos/background-3.mp4', fallbackCss: 'linear-gradient(-45deg,#1f1c2c,#928dab)' },
     { title: 'Sunset Gradient', type: 'css', css: 'linear-gradient(-45deg,#f093fb,#f5576c,#4facfe,#00f2fe)' },
     { title: 'Forest Mist', type: 'css', css: 'linear-gradient(-45deg,#8EC5FC,#E0C3FC,#8ED1FC,#C3F0CA)' }
   ];
   
   let currentVideoIndex = 0;
   let backgroundTimer = null;
   
   function clearBackgroundTimer() {
     if (backgroundTimer) { clearTimeout(backgroundTimer); backgroundTimer = null; }
   }
   
   function setVideoSource(index) {
     clearBackgroundTimer();
     if (!Array.isArray(videoSources) || videoSources.length === 0) return;
     currentVideoIndex = ((index % videoSources.length + videoSources.length) % videoSources.length);
     const source = videoSources[currentVideoIndex];
   
     try { document.body.style.background = ''; } catch (e) {}
     const bgV = bgVideoEl();
     const bgT = bgTitleEl();
     if (bgT) bgT.textContent = source.title || '';
   
     if (source.type === 'css' || !source.url) {
       if (bgV) {
         try { bgV.pause(); } catch (e) {}
         bgV.style.display = 'none';
         try { bgV.removeAttribute('src'); bgV.load(); } catch (e) {}
       }
       document.body.style.background = source.css || source.fallbackCss || 'linear-gradient(180deg,#111,#333)';
       backgroundTimer = setTimeout(() => setVideoSource(currentVideoIndex + 1), 10000);
       return;
     }
   
     if (!bgV) return;
     bgV.style.display = 'block';
     bgV.muted = true;
     bgV.playsInline = true;
     bgV.loop = false;
     try { bgV.pause(); } catch (e) {}
   
     // Use source.url; ensure it exists
     bgV.src = source.url;
     try { bgV.load(); } catch (e) {}
   
     const p = bgV.play();
     if (p && typeof p.then === 'function') {
       p.then(() => {
         if (bgT) bgT.textContent = source.title || '';
       }).catch(err => {
         console.warn('[bg] Video play() rejected:', err, 'url:', source.url);
         bgV.style.display = 'none';
         document.body.style.background = source.fallbackCss || 'linear-gradient(180deg,#111,#333)';
         if (bgT) bgT.textContent = source.title || '';
         // Advance after failure
         backgroundTimer = setTimeout(() => setVideoSource(currentVideoIndex + 1), 2000);
       });
     } else {
       if (bgT) bgT.textContent = source.title || '';
     }
   }
   
   (function wireVideoEvents() {
     const bgV = bgVideoEl();
     if (!bgV) return;
     bgV.addEventListener('ended', () => setVideoSource(currentVideoIndex + 1));
     bgV.addEventListener('error', (ev) => {
       console.error('[bg] Video element error', ev, 'currentSrc:', bgV.currentSrc);
       setVideoSource(currentVideoIndex + 1);
     });
     bgV.addEventListener('stalled', () => console.warn('[bg] Video stalled:', bgV.currentSrc));
     bgV.addEventListener('loadedmetadata', () => {
       const bgT = bgTitleEl();
       if (bgT && videoSources[currentVideoIndex]) bgT.textContent = videoSources[currentVideoIndex].title || '';
     });
   })();