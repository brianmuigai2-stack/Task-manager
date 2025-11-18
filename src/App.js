import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { useAuth } from './hooks/useAuth';
import AuthModal from './components/AuthModal';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import VideoBackground from './components/VideoBackground';
import FriendsModal from './components/FriendsModal';
import PomodoroTimer from './components/PomodoroTimer';
import StatsModal from './components/StatsModal';
import ThemeSelector from './components/ThemeSelector';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import WelcomeModal from './components/WelcomeModal';
import DemoTasks from './components/DemoTasks';
import ProfileModal from './components/ProfileModal';
import SocialFeed from './components/SocialFeed';
import NotificationSystem from './components/NotificationSystem';
import UserProfileModal from './components/UserProfileModal';
import MessagesModal from './components/MessagesModal';
import Loading from './components/Loading';
import InstallBanner from './components/InstallBanner';
import InstallModal from './components/InstallModal';
import './App.css';

function App() {
  const { user, userDoc, loading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState(['General']);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSocialFeed, setShowSocialFeed] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort tasks by creation date
        tasksData.sort((a, b) => {
          const aDate = a.createdAt?.seconds || a.createdAt?.getTime() || 0;
          const bDate = b.createdAt?.seconds || b.createdAt?.getTime() || 0;
          return bDate - aDate;
        });
        
        setTasks(tasksData);
        
        // Show welcome modal for new users with no tasks
        if (tasksData.length === 0 && !localStorage.getItem('welcomeShown')) {
          setShowWelcomeModal(true);
          setIsNewUser(true);
        }
      });

      return unsubscribe;
    }
  }, [user]);

  useEffect(() => {
    if (userDoc && userDoc.categories) {
      setCategories(userDoc.categories);
    }
  }, [userDoc]);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAddTask = async (taskData) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'tasks'), {
        ...taskData,
        userId: user.uid,
        createdAt: new Date(),
        timeSpent: 0,
        subtasks: []
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const updateData = {
        completed: !task.completed
      };
      
      if (!task.completed) {
        updateData.completedAt = new Date();
        // Award XP for completion
        const userRef = doc(db, 'users', user.uid);
        const currentXP = userDoc?.xp || 0;
        await updateDoc(userRef, { xp: currentXP + 10 });
      }
      
      await updateDoc(doc(db, 'tasks', taskId), updateData);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task) => {
    // For now, just log the task - you can implement a modal later
    console.log('Edit task:', task);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const activeTasks = tasks.filter(task => !task.completed);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="App">
      <VideoBackground />

      <InstallBanner
        deferredPrompt={deferredPrompt}
        onInstall={handleInstall}
        onShowInstructions={() => setShowInstallModal(true)}
      />

      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        user={user}
        userDoc={userDoc}
        onViewProfile={(userId) => {
          setSelectedUserId(userId);
          setShowUserProfile(true);
        }}
      />

      <PomodoroTimer
        isOpen={showPomodoroTimer}
        onClose={() => setShowPomodoroTimer(false)}
        currentTask={selectedTask}
      />

      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        tasks={tasks}
        userDoc={userDoc}
      />

      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />

      <KeyboardShortcuts
        onQuickAdd={() => {
          const taskInput = document.querySelector('#task-input');
          if (taskInput) taskInput.focus();
        }}
        onOpenPomodoro={() => setShowPomodoroTimer(true)}
        onOpenStats={() => setShowStatsModal(true)}
        onOpenThemes={() => setShowThemeSelector(true)}
        onFocusSearch={() => {
          const searchInput = document.querySelector('#search-input');
          if (searchInput) searchInput.focus();
        }}
      />

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          localStorage.setItem('welcomeShown', 'true');
        }}
        onLoadDemo={() => setIsNewUser(true)}
        userName={userDoc?.displayName || userDoc?.username || 'User'}
      />

      {isNewUser && (
        <DemoTasks
          user={user}
          onComplete={() => setIsNewUser(false)}
        />
      )}

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        userDoc={userDoc}
      />

      <SocialFeed
        isOpen={showSocialFeed}
        onClose={() => setShowSocialFeed(false)}
        user={user}
        userDoc={userDoc}
      />

      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId}
        currentUser={user}
        currentUserDoc={userDoc}
      />

      <MessagesModal
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
        user={user}
        userDoc={userDoc}
      />

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content install-modal">
            <h2>Install Task Manager</h2>
            <p>Install our app for offline access and a better experience!</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleInstall}>Install</button>
              <button className="btn btn-secondary" onClick={() => setShowInstallPrompt(false)}>Later</button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="container">
          <header>
            <div>
              <h1>My Tasks</h1>
              <p className="welcome-user">
                Welcome, <span>{userDoc?.displayName || userDoc?.username}</span>
              </p>
            </div>
            <div className="header-controls">
              <NotificationSystem user={user} />
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowProfileModal(true)}
                title="Profile"
              >
                <i className="fas fa-user"></i>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowSocialFeed(true)}
                title="Social Feed"
              >
                <i className="fas fa-globe"></i>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowMessages(true)}
                title="Messages"
              >
                <i className="fas fa-envelope"></i>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowPomodoroTimer(true)}
                title="Pomodoro Timer"
              >
                <i className="fas fa-clock"></i>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowFriendsModal(true)}
                title="Friends"
              >
                <i className="fas fa-users"></i>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowStatsModal(true)}
                title="Stats"
              >
                <i className="fas fa-chart-bar"></i>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowThemeSelector(true)}
                title="Themes"
              >
                <i className="fas fa-palette"></i>
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleInstall}
                title="Download App"
                style={{ display: deferredPrompt ? 'inline-block' : 'none' }}
              >
                <i className="fas fa-download"></i> Download
              </button>
              <button className="btn btn-danger" onClick={handleSignOut} title="Sign out">
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </header>

          <main>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="quick-actions">
              <button 
                className="quick-btn"
                onClick={() => {
                  const taskInput = document.querySelector('#task-input');
                  if (taskInput) taskInput.focus();
                }}
              >
                <i className="fas fa-plus"></i> Quick Add
              </button>
              <button 
                className="quick-btn"
                onClick={() => setShowPomodoroTimer(true)}
              >
                <i className="fas fa-clock"></i> Focus Time
              </button>
            </div>

            <TaskForm onAddTask={handleAddTask} categories={categories} />

            <div className="filter-controls">
              <div className="filter-buttons">
                {['all', 'active', 'completed'].map(filterType => (
                  <button
                    key={filterType}
                    className={`filter-btn ${filter === filterType ? 'active' : ''}`}
                    onClick={() => setFilter(filterType)}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>
              <div className="category-filter-buttons">
                <button
                  className={`category-filter-btn ${!categoryFilter ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('')}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    className={`category-filter-btn ${categoryFilter === category ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <TaskList
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onStartPomodoro={(task) => {
                setSelectedTask(task);
                setShowPomodoroTimer(true);
              }}
              filter={filter}
              searchTerm={searchTerm}
              categoryFilter={categoryFilter}
            />
          </main>

          <footer>
            <p>{activeTasks.length} tasks left</p>
            <div className="keyboard-shortcuts-hint">
              <p><kbd>Ctrl+K</kbd> Search • <kbd>Ctrl+N</kbd> New Task • <kbd>Ctrl+P</kbd> Pomodoro • <kbd>Ctrl+S</kbd> Stats • <kbd>Ctrl+T</kbd> Themes</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;