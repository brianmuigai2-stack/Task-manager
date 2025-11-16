import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const FriendsModal = ({ isOpen, onClose, user, userDoc, onViewProfile }) => {
  const [inviteUsername, setInviteUsername] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadFriendRequests();
      loadFriends();
      loadSuggestions();
    }
  }, [isOpen, user, userDoc]);

  const loadFriendRequests = async () => {
    if (!userDoc?.friendRequests) return;
    const requests = [];
    for (const [uid, status] of Object.entries(userDoc.friendRequests)) {
      if (status === 'pending') {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          requests.push({ uid, ...userSnap.data() });
        }
      }
    }
    setFriendRequests(requests);
  };

  const loadFriends = async () => {
    if (!userDoc?.friends) return;
    const friendsList = [];
    for (const uid of userDoc.friends) {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        friendsList.push({ uid, ...userSnap.data() });
      }
    }
    setFriends(friendsList);
  };

  const loadSuggestions = async () => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    const snapshot = await getDocs(q);
    
    const allUsers = [];
    const myFriends = userDoc?.friends || [];
    
    snapshot.forEach(doc => {
      if (doc.id !== user.uid && !myFriends.includes(doc.id)) {
        allUsers.push({ uid: doc.id, ...doc.data() });
      }
    });
    
    // Sort by XP (most active users first)
    allUsers.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    setSuggestions(allUsers.slice(0, 8));
  };

  const sendFriendRequest = async (targetUid, targetUsername) => {
    setLoading(true);
    try {
      const targetUserRef = doc(db, 'users', targetUid);
      await updateDoc(targetUserRef, {
        [`friendRequests.${user.uid}`]: 'pending'
      });
      
      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: targetUid,
        type: 'friend_request',
        message: `${userDoc?.displayName || userDoc?.username} sent you a friend request`,
        read: false,
        createdAt: new Date()
      });
      
      alert(`Friend request sent to ${targetUsername}!`);
      setInviteUsername('');
    } catch (error) {
      alert('Error sending friend request');
    }
    setLoading(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;

    const usernameRef = doc(db, 'usernames', inviteUsername.toLowerCase());
    const usernameSnap = await getDoc(usernameRef);
    
    if (!usernameSnap.exists()) {
      alert('User not found');
      return;
    }

    const targetUid = usernameSnap.data().uid;
    await sendFriendRequest(targetUid, inviteUsername);
  };

  const acceptFriendRequest = async (friendUid) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendUid);
      
      // Add to friends list and remove from requests
      await updateDoc(userRef, {
        friends: arrayUnion(friendUid)
      });
      
      await updateDoc(friendRef, {
        friends: arrayUnion(user.uid)
      });
      
      // Remove the friend request
      const userDoc = await getDoc(userRef);
      const requests = userDoc.data().friendRequests || {};
      delete requests[friendUid];
      
      await updateDoc(userRef, {
        friendRequests: requests
      });
      
      loadFriendRequests();
      loadFriends();
    } catch (error) {
      alert('Error accepting friend request');
    }
    setLoading(false);
  };

  const declineFriendRequest = async (friendUid) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`friendRequests.${friendUid}`]: 'declined'
      });
      loadFriendRequests();
    } catch (error) {
      alert('Error declining friend request');
    }
    setLoading(false);
  };

  const removeFriend = async (friendUid) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendUid);
      
      await updateDoc(userRef, {
        friends: arrayRemove(friendUid)
      });
      
      await updateDoc(friendRef, {
        friends: arrayRemove(user.uid)
      });
      
      loadFriends();
    } catch (error) {
      alert('Error removing friend');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Friends</h2>
        
        <div className="friends-section">
          <h3>Invite a Friend</h3>
          <form onSubmit={handleInvite}>
            <input
              type="text"
              placeholder="Enter username to invite"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Send Invite
            </button>
          </form>
        </div>

        {friendRequests.length > 0 && (
          <div className="friends-section">
            <h3>Friend Requests</h3>
            {friendRequests.map(request => (
              <div key={request.uid} className="request-item">
                <span>{request.displayName || request.username}</span>
                <div className="request-buttons">
                  <button 
                    className="accept-btn"
                    onClick={() => acceptFriendRequest(request.uid)}
                    disabled={loading}
                  >
                    Accept
                  </button>
                  <button 
                    className="decline-btn"
                    onClick={() => declineFriendRequest(request.uid)}
                    disabled={loading}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="friends-section">
          <h3>Your Friends ({friends.length})</h3>
          {friends.length > 0 ? (
            friends.map(friend => (
              <div key={friend.uid} className="friend-item">
                <div 
                  className="user-info clickable-user"
                  onClick={() => onViewProfile && onViewProfile(friend.uid)}
                >
                  <div className="user-avatar-small">
                    {friend.profilePicture ? (
                      <img src={friend.profilePicture} alt="User" />
                    ) : (
                      <div className="default-avatar">
                        {(friend.displayName || friend.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <span>{friend.displayName || friend.username}</span>
                    <small>Level {Math.floor((friend.xp || 0) / 100) + 1}</small>
                  </div>
                </div>
                <button 
                  className="remove-friend-btn"
                  onClick={() => removeFriend(friend.uid)}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p>No friends yet. Send some invites!</p>
          )}
        </div>

        <div className="friends-section">
          <h3>🌐 Discover Users</h3>
          <p>Find people to connect with:</p>
          {suggestions.map(suggestion => (
            <div key={suggestion.uid} className="friend-item">
              <div 
                className="user-info clickable-user"
                onClick={() => onViewProfile && onViewProfile(suggestion.uid)}
              >
                <div className="user-avatar-small">
                  {suggestion.profilePicture ? (
                    <img src={suggestion.profilePicture} alt="User" />
                  ) : (
                    <div className="default-avatar">
                      {(suggestion.displayName || suggestion.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <span>{suggestion.displayName || suggestion.username}</span>
                  <small>Level {Math.floor((suggestion.xp || 0) / 100) + 1}</small>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => sendFriendRequest(suggestion.uid, suggestion.username)}
                disabled={loading}
              >
                Add Friend
              </button>
            </div>
          ))}
        </div>

        {friends.length === 0 && suggestions.length > 0 && (
          <div className="friends-section">
            <h3>Suggested Friends</h3>
            <p>People using the app you might want to connect with:</p>
            {suggestions.map(suggestion => (
              <div key={suggestion.uid} className="friend-item">
                <span>{suggestion.displayName || suggestion.username}</span>
                <button 
                  className="btn btn-primary"
                  onClick={() => sendFriendRequest(suggestion.uid, suggestion.username)}
                  disabled={loading}
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsModal;