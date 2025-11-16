import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { addProfileComment, getProfileComments, toggleProfileLike, getProfileLikes, hasUserLikedProfile, addNotification } from '../services/localSocial';

const UserProfileModal = ({ isOpen, onClose, userId, currentUser, currentUserDoc }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLikedProfile, setHasLikedProfile] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [profileComments, setProfileComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserProfile();
      loadUserAchievements();
      loadProfileComments();
      
      // Check if user has liked this profile
      const liked = hasUserLikedProfile(userId, currentUser.uid);
      setHasLikedProfile(liked);
    }
  }, [isOpen, userId]);

  const loadUserProfile = async () => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserProfile({ uid: userId, ...userData });
        setHasLikedProfile(userData.profileLikes?.includes(currentUser.uid) || false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserAchievements = async () => {
    try {
      const q = query(
        collection(db, 'achievements'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const achievements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      achievements.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      setUserAchievements(achievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const toggleProfileLikeLocal = () => {
    setLoading(true);
    try {
      const isLiked = toggleProfileLike(userId, currentUser.uid);
      setHasLikedProfile(isLiked);
      
      if (isLiked) {
        // Add notification
        addNotification(
          userId,
          'profile_like',
          `${currentUserDoc?.displayName || currentUserDoc?.username} liked your profile`
        );
      }
      
      // Update profile likes count
      const likes = getProfileLikes(userId);
      setUserProfile(prev => ({ ...prev, profileLikes: likes.map(like => like.userId) }));
    } catch (error) {
      console.error('Error toggling profile like:', error);
    }
    setLoading(false);
  };

  const loadProfileComments = () => {
    try {
      const comments = getProfileComments(userId);
      setProfileComments(comments);
    } catch (error) {
      console.warn('Error loading profile comments:', error);
      setProfileComments([]);
    }
  };

  const addProfileCommentLocal = () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      addProfileComment(
        userId,
        currentUser.uid,
        currentUserDoc?.displayName || currentUserDoc?.username,
        currentUserDoc?.profilePicture || '',
        newComment
      );
      
      // Add notification
      addNotification(
        userId,
        'profile_comment',
        `${currentUserDoc?.displayName || currentUserDoc?.username} commented on your profile`
      );
      
      setNewComment('');
      loadProfileComments(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUserDoc?.displayName || currentUserDoc?.username,
        senderPicture: currentUserDoc?.profilePicture || '',
        receiverId: userId,
        text: messageText,
        read: false,
        createdAt: new Date()
      });
      
      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        type: 'message',
        message: `${currentUserDoc?.displayName || currentUserDoc?.username} sent you a message`,
        read: false,
        createdAt: new Date()
      });
      
      setMessageText('');
      setShowMessageModal(false);
      alert('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
    setLoading(false);
  };

  if (!isOpen || !userProfile) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content user-profile-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="user-profile-header">
          <div className="profile-picture-large">
            {userProfile.profilePicture ? (
              <img src={userProfile.profilePicture} alt="Profile" />
            ) : (
              <div className="default-avatar">
                {(userProfile.displayName || userProfile.username || 'U')[0].toUpperCase()}
              </div>
            )}
            <button 
              className={`profile-like-btn ${hasLikedProfile ? 'liked' : ''}`}
              onClick={toggleProfileLikeLocal}
              disabled={loading}
            >
              ❤️ {userProfile.profileLikes?.length || 0}
            </button>
          </div>
          
          <div className="user-info-section">
            <h2>{userProfile.displayName || userProfile.username}</h2>
            {userProfile.bio && <p className="user-bio">{userProfile.bio}</p>}
            
            <div className="user-stats-row">
              <div className="stat">
                <span className="stat-number">{userProfile.friends?.length || 0}</span>
                <span className="stat-label">Friends</span>
              </div>
              <div className="stat">
                <span className="stat-number">{userProfile.xp || 0}</span>
                <span className="stat-label">XP</span>
              </div>
              <div className="stat">
                <span className="stat-number">{Math.floor((userProfile.xp || 0) / 100) + 1}</span>
                <span className="stat-label">Level</span>
              </div>
            </div>
            
            <div className="profile-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowMessageModal(true)}
              >
                💬 Send Message
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowComments(!showComments)}
              >
                💭 {showComments ? 'Hide' : 'Show'} Comments ({profileComments.length})
              </button>
            </div>
          </div>
        </div>

        {showComments && (
          <div className="profile-comments-section">
            <h3>💭 Profile Comments</h3>
            
            <div className="add-comment">
              <input
                type="text"
                placeholder="Write a comment on this profile..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addProfileCommentLocal();
                  }
                }}
              />
              <button 
                onClick={addProfileCommentLocal}
                disabled={loading || !newComment.trim()}
                className="btn btn-primary btn-sm"
              >
                Post
              </button>
            </div>
            
            <div className="comments-list">
              {profileComments.length > 0 ? (
                profileComments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      {comment.commenterPicture ? (
                        <img src={comment.commenterPicture} alt="User" />
                      ) : (
                        <div className="default-avatar">
                          {(comment.commenterName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="comment-content">
                      <strong>{comment.commenterName}</strong>
                      <p>{comment.text}</p>
                      <small>{new Date(comment.createdAt?.seconds ? comment.createdAt.seconds * 1000 : comment.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-comments">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        )}

        <div className="user-achievements-section">
          <h3>🏆 Recent Achievements ({userAchievements.length})</h3>
          {userAchievements.length > 0 ? (
            <div className="achievements-list">
              {userAchievements.slice(0, 5).map(achievement => (
                <div key={achievement.id} className="achievement-item">
                  <span>{achievement.text}</span>
                  <div className="achievement-meta">
                    <small>{new Date(achievement.createdAt.seconds * 1000).toLocaleDateString()}</small>
                    <span className="likes">❤️ {achievement.likes?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No achievements shared yet.</p>
          )}
        </div>

        {showMessageModal && (
          <div className="message-modal">
            <div className="message-modal-content">
              <h3>Send Message to {userProfile.displayName || userProfile.username}</h3>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                rows="4"
              />
              <div className="message-modal-actions">
                <button 
                  className="btn btn-primary"
                  onClick={sendMessage}
                  disabled={loading || !messageText.trim()}
                >
                  Send
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowMessageModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;