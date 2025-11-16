// Temporary local storage solution for social features
// This will work until Firestore security rules are properly configured

const STORAGE_KEYS = {
  PROFILE_COMMENTS: 'profileComments',
  PROFILE_LIKES: 'profileLikes',
  ACHIEVEMENTS: 'achievements',
  COMMENTS: 'comments',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications'
};

// Helper to get data from localStorage
const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

// Helper to save data to localStorage
const setLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Profile Comments
export const addProfileComment = (profileUserId, commenterId, commenterName, commenterPicture, text) => {
  const comments = getLocalData(STORAGE_KEYS.PROFILE_COMMENTS);
  const newComment = {
    id: Date.now().toString(),
    profileUserId,
    commenterId,
    commenterName,
    commenterPicture,
    text,
    createdAt: { seconds: Date.now() / 1000 }
  };
  comments.push(newComment);
  setLocalData(STORAGE_KEYS.PROFILE_COMMENTS, comments);
  return newComment;
};

export const getProfileComments = (profileUserId) => {
  const comments = getLocalData(STORAGE_KEYS.PROFILE_COMMENTS);
  return comments.filter(comment => comment.profileUserId === profileUserId)
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
};

// Profile Likes
export const toggleProfileLike = (profileUserId, currentUserId) => {
  const likes = getLocalData(STORAGE_KEYS.PROFILE_LIKES);
  const existingLike = likes.find(like => like.profileUserId === profileUserId && like.userId === currentUserId);
  
  if (existingLike) {
    // Remove like
    const updatedLikes = likes.filter(like => !(like.profileUserId === profileUserId && like.userId === currentUserId));
    setLocalData(STORAGE_KEYS.PROFILE_LIKES, updatedLikes);
    return false;
  } else {
    // Add like
    likes.push({
      id: Date.now().toString(),
      profileUserId,
      userId: currentUserId,
      createdAt: { seconds: Date.now() / 1000 }
    });
    setLocalData(STORAGE_KEYS.PROFILE_LIKES, likes);
    return true;
  }
};

export const getProfileLikes = (profileUserId) => {
  const likes = getLocalData(STORAGE_KEYS.PROFILE_LIKES);
  return likes.filter(like => like.profileUserId === profileUserId);
};

export const hasUserLikedProfile = (profileUserId, currentUserId) => {
  const likes = getLocalData(STORAGE_KEYS.PROFILE_LIKES);
  return likes.some(like => like.profileUserId === profileUserId && like.userId === currentUserId);
};

// Achievements
export const addAchievement = (userId, userName, userPicture, text) => {
  const achievements = getLocalData(STORAGE_KEYS.ACHIEVEMENTS);
  const newAchievement = {
    id: Date.now().toString(),
    userId,
    userName,
    userPicture,
    text,
    likes: [],
    createdAt: { seconds: Date.now() / 1000 }
  };
  achievements.push(newAchievement);
  setLocalData(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  return newAchievement;
};

export const getAchievements = (userId = null) => {
  const achievements = getLocalData(STORAGE_KEYS.ACHIEVEMENTS);
  const filtered = userId ? achievements.filter(achievement => achievement.userId === userId) : achievements;
  return filtered.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
};

// Simple notification system
export const addNotification = (userId, type, message) => {
  const notifications = getLocalData(STORAGE_KEYS.NOTIFICATIONS);
  const newNotification = {
    id: Date.now().toString(),
    userId,
    type,
    message,
    read: false,
    createdAt: { seconds: Date.now() / 1000 }
  };
  notifications.push(newNotification);
  setLocalData(STORAGE_KEYS.NOTIFICATIONS, notifications);
  return newNotification;
};

export const getNotifications = (userId) => {
  const notifications = getLocalData(STORAGE_KEYS.NOTIFICATIONS);
  return notifications.filter(notification => notification.userId === userId && !notification.read)
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
};