import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, addDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const SocialFeed = ({ isOpen, onClose, user, userDoc }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});

  useEffect(() => {
    if (isOpen && user) {
      loadFeed();
    }
  }, [isOpen, user]);

  const loadFeed = () => {
    const q = query(
      collection(db, 'achievements'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const achievementsData = [];
      
      for (const docSnap of snapshot.docs) {
        const achievement = { id: docSnap.id, ...docSnap.data() };
        
        // Get mutual friends count
        if (achievement.userId !== user.uid) {
          const mutualFriends = await getMutualFriends(achievement.userId);
          achievement.mutualFriends = mutualFriends;
        }
        
        achievementsData.push(achievement);
      }
      
      setAchievements(achievementsData);
    }, (error) => {
      console.warn('Social feed access denied:', error);
      setAchievements([]);
    });

    return unsubscribe;
  };

  const getMutualFriends = async (otherUserId) => {
    try {
      const otherUserRef = doc(db, 'users', otherUserId);
      const otherUserSnap = await getDoc(otherUserRef);
      
      if (!otherUserSnap.exists()) return [];
      
      const otherUserFriends = otherUserSnap.data().friends || [];
      const myFriends = userDoc?.friends || [];
      
      return myFriends.filter(friendId => otherUserFriends.includes(friendId));
    } catch (error) {
      console.error('Error getting mutual friends:', error);
      return [];
    }
  };

  const toggleLike = async (achievementId, currentLikes, postOwnerId) => {
    setLoading(true);
    try {
      const achievementRef = doc(db, 'achievements', achievementId);
      const hasLiked = currentLikes.includes(user.uid);
      
      if (hasLiked) {
        await updateDoc(achievementRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(achievementRef, {
          likes: arrayUnion(user.uid)
        });
        
        // Create notification for post owner
        if (postOwnerId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: postOwnerId,
            type: 'like',
            message: `${userDoc?.displayName || userDoc?.username} liked your achievement`,
            read: false,
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
    setLoading(false);
  };

  const addComment = async (achievementId, postOwnerId) => {
    const comment = newComment[achievementId];
    if (!comment?.trim()) return;
    
    try {
      await addDoc(collection(db, 'comments'), {
        achievementId,
        userId: user.uid,
        userName: userDoc?.displayName || userDoc?.username,
        userPicture: userDoc?.profilePicture || '',
        text: comment,
        createdAt: new Date()
      });
      
      if (postOwnerId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: postOwnerId,
          type: 'comment',
          message: `${userDoc?.displayName || userDoc?.username} commented on your achievement`,
          read: false,
          createdAt: new Date()
        });
      }
      
      setNewComment({ ...newComment, [achievementId]: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const loadComments = async (achievementId) => {
    try {
      const q = query(
        collection(db, 'comments'),
        where('achievementId', '==', achievementId),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  };

  const toggleComments = async (achievementId) => {
    if (showComments[achievementId]?.show) {
      setShowComments({ ...showComments, [achievementId]: { show: false, comments: [] } });
    } else {
      const comments = await loadComments(achievementId);
      setShowComments({ 
        ...showComments, 
        [achievementId]: { show: true, comments } 
      });
    }
  };

  const loadCommentsRealtime = (achievementId) => {
    const q = query(
      collection(db, 'comments'),
      where('achievementId', '==', achievementId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      comments.sort((a, b) => {
        const aTime = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000 || 0;
        const bTime = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000 || 0;
        return aTime - bTime;
      });
      
      setShowComments(prev => ({
        ...prev,
        [achievementId]: { show: true, comments }
      }));
    }, (error) => {
      console.warn('Comments access denied:', error);
      setShowComments(prev => ({
        ...prev,
        [achievementId]: { show: true, comments: [] }
      }));
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content social-feed-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>🌟 Community Feed</h2>
        
        <div className="feed-container">
          {achievements.length > 0 ? (
            achievements.map(achievement => (
              <div key={achievement.id} className="feed-post">
                <div className="post-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      {achievement.userPicture ? (
                        <img src={achievement.userPicture} alt="User" />
                      ) : (
                        <div className="default-avatar">
                          {(achievement.userName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{achievement.userName}</span>
                      <small className="post-time">
                        {new Date(achievement.createdAt.seconds * 1000).toLocaleDateString()}
                      </small>
                      {achievement.mutualFriends && achievement.mutualFriends.length > 0 && (
                        <small className="mutual-friends">
                          👥 {achievement.mutualFriends.length} mutual friend{achievement.mutualFriends.length > 1 ? 's' : ''}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="post-content">
                  <p>{achievement.text}</p>
                </div>
                
                <div className="post-actions">
                  <button 
                    className={`like-btn ${achievement.likes?.includes(user.uid) ? 'liked' : ''}`}
                    onClick={() => toggleLike(achievement.id, achievement.likes || [], achievement.userId)}
                    disabled={loading}
                  >
                    ❤️ {achievement.likes?.length || 0}
                  </button>
                  
                  <button 
                    className="comment-btn"
                    onClick={() => {
                      if (!showComments[achievement.id]?.show) {
                        const unsubscribe = loadCommentsRealtime(achievement.id);
                        // Store unsubscribe function for cleanup
                        setShowComments(prev => ({
                          ...prev,
                          [achievement.id]: { show: true, comments: [], unsubscribe }
                        }));
                      } else {
                        // Cleanup listener
                        if (showComments[achievement.id]?.unsubscribe) {
                          showComments[achievement.id].unsubscribe();
                        }
                        setShowComments(prev => ({
                          ...prev,
                          [achievement.id]: { show: false, comments: [] }
                        }));
                      }
                    }}
                  >
                    💬 {showComments[achievement.id]?.show ? 'Hide' : 'Show'} Comments
                  </button>
                  
                  {achievement.userId === user.uid && (
                    <span className="own-post">Your post</span>
                  )}
                </div>
                
                {showComments[achievement.id]?.show && (
                  <div className="comments-section">
                    <div className="add-comment">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment[achievement.id] || ''}
                        onChange={(e) => setNewComment({
                          ...newComment,
                          [achievement.id]: e.target.value
                        })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment(achievement.id, achievement.userId);
                          }
                        }}
                      />
                      <button 
                        onClick={() => addComment(achievement.id, achievement.userId)}
                        className="btn btn-primary btn-sm"
                      >
                        Post
                      </button>
                    </div>
                    
                    <div className="comments-list">
                      {showComments[achievement.id]?.comments?.length > 0 ? (
                        showComments[achievement.id].comments.map(comment => (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-avatar">
                              {comment.userPicture ? (
                                <img src={comment.userPicture} alt="User" />
                              ) : (
                                <div className="default-avatar">
                                  {(comment.userName || 'U')[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="comment-content">
                              <strong>{comment.userName}</strong>
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
              </div>
            ))
          ) : (
            <div className="empty-feed">
              <p>🎯 No achievements shared yet!</p>
              <p>Be the first to share your productivity wins!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialFeed;