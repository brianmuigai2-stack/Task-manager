import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getProfileComments, getProfileLikes, addAchievement, getAchievements } from '../services/localSocial';

const ProfileModal = ({ isOpen, onClose, user, userDoc }) => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [profileComments, setProfileComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (userDoc) {
      setDisplayName(userDoc.displayName || '');
      setBio(userDoc.bio || '');
      setProfilePicture(userDoc.profilePicture || '');
      loadAchievements();
      loadProfileComments();
    }
  }, [userDoc]);

  const loadAchievements = () => {
    if (!user) return;
    try {
      const achievementsData = getAchievements(user.uid);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadProfileComments = () => {
    if (!user) return;
    try {
      const comments = getProfileComments(user.uid);
      setProfileComments(comments);
    } catch (error) {
      console.warn('Error loading profile comments:', error);
      setProfileComments([]);
    }
  };

  const saveProfilePicture = async (pictureData) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePicture: pictureData
      });
    } catch (error) {
      console.error('Error saving profile picture:', error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        bio,
        profilePicture
      });
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile');
    }
    setLoading(false);
  };

  const shareAchievement = (achievementText) => {
    setLoading(true);
    try {
      addAchievement(
        user.uid,
        userDoc?.displayName || userDoc?.username,
        userDoc?.profilePicture || '',
        achievementText
      );
      loadAchievements();
      alert('Achievement shared!');
    } catch (error) {
      alert('Error sharing achievement');
    }
    setLoading(false);
  };

  const generateProfilePicture = async () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const initial = (userDoc?.displayName || userDoc?.username || 'U')[0].toUpperCase();
    const svg = `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="${color}"/>
        <text x="50" y="65" font-family="Arial" font-size="40" fill="white" text-anchor="middle">${initial}</text>
      </svg>
    `)}`;
    setProfilePicture(svg);
    await saveProfilePicture(svg);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const newPicture = e.target.result;
        setProfilePicture(newPicture);
        await saveProfilePicture(newPicture);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 300, height: 300 } 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      alert('Camera access denied or not available');
    }
  };

  const capturePhoto = async () => {
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 300, 300);
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setProfilePicture(dataURL);
    await saveProfilePicture(dataURL);
    stopCamera();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  useEffect(() => {
    if (stream && showCamera) {
      const video = document.getElementById('camera-video');
      if (video) {
        video.srcObject = stream;
      }
    }
  }, [stream, showCamera]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content profile-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>👤 My Profile</h2>
        
        <div className="profile-header">
          <div className="profile-picture-section">
            <div className="profile-picture">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" />
              ) : (
                <div className="default-avatar">
                  {(userDoc?.displayName || userDoc?.username || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="profile-picture-controls">
              <input 
                type="file" 
                id="file-upload" 
                accept="image/*" 
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => document.getElementById('file-upload').click()}
              >
                📁 Upload Photo
              </button>
              
              <button 
                className="btn btn-secondary btn-sm"
                onClick={startCamera}
              >
                📷 Take Photo
              </button>
              
              <button 
                className="btn btn-secondary btn-sm"
                onClick={generateProfilePicture}
              >
                🎨 Generate Avatar
              </button>
            </div>
            
            {showCamera && (
              <div className="camera-modal">
                <div className="camera-container">
                  <video 
                    id="camera-video" 
                    autoPlay 
                    playsInline
                    width="300" 
                    height="300"
                  ></video>
                  <div className="camera-controls">
                    <button 
                      className="btn btn-primary"
                      onClick={capturePhoto}
                    >
                      📸 Capture
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={stopCamera}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{userDoc?.friends?.length || 0}</span>
              <span className="stat-label">Friends</span>
            </div>
            <div className="stat">
              <span className="stat-number">{userDoc?.xp || 0}</span>
              <span className="stat-label">XP</span>
            </div>
            <div className="stat">
              <span className="stat-number">{Math.floor((userDoc?.xp || 0) / 100) + 1}</span>
              <span className="stat-label">Level</span>
            </div>
            <div className="stat">
              <span className="stat-number">{getProfileLikes(user?.uid || '').length}</span>
              <span className="stat-label">Profile Likes</span>
            </div>
          </div>
          
          <div className="profile-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowComments(!showComments)}
            >
              💭 {showComments ? 'Hide' : 'View'} Comments ({profileComments.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="profile-form">
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>
          
          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Profile Picture URL</label>
            <input
              type="url"
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
              placeholder="https://example.com/your-picture.jpg"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <div className="achievements-section">
          <h3>🏆 Share Achievement</h3>
          <div className="achievement-buttons">
            <button 
              className="achievement-btn"
              onClick={() => shareAchievement('🎯 Completed 10 tasks today!')}
            >
              Task Master
            </button>
            <button 
              className="achievement-btn"
              onClick={() => shareAchievement('🔥 7-day productivity streak!')}
            >
              Streak Warrior
            </button>
            <button 
              className="achievement-btn"
              onClick={() => shareAchievement('⭐ Reached Level 5!')}
            >
              Level Up
            </button>
            <button 
              className="achievement-btn"
              onClick={() => shareAchievement('🍅 Completed 5 Pomodoro sessions!')}
            >
              Focus Master
            </button>
          </div>
        </div>

        {showComments && (
          <div className="profile-comments-section">
            <h3>💭 Comments on My Profile</h3>
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
                <p className="no-comments">No comments on your profile yet.</p>
              )}
            </div>
          </div>
        )}

        <div className="my-achievements">
          <h3>📜 My Shared Achievements</h3>
          {achievements.length > 0 ? (
            achievements.map(achievement => (
              <div key={achievement.id} className="achievement-post">
                <div className="achievement-content">
                  <span>{achievement.text}</span>
                  <small>{new Date(achievement.createdAt.seconds * 1000).toLocaleDateString()}</small>
                </div>
                <div className="achievement-likes">
                  ❤️ {achievement.likes?.length || 0}
                </div>
              </div>
            ))
          ) : (
            <p>No achievements shared yet. Share your first achievement above!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;