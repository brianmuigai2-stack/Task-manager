import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const NotificationSystem = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsData);
      }, (error) => {
        console.warn('Notifications access denied:', error);
        setNotifications([]);
      });

      return unsubscribe;
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request': return '👥';
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'achievement': return '🏆';
      default: return '🔔';
    }
  };

  return (
    <div className="notification-system">
      <button 
        className="notification-btn"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <i className="fas fa-bell"></i>
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">
          <h3>Notifications</h3>
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className="notification-item"
                onClick={() => markAsRead(notification.id)}
              >
                <span className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <small>{new Date(notification.createdAt.seconds * 1000).toLocaleString()}</small>
                </div>
              </div>
            ))
          ) : (
            <p className="no-notifications">No new notifications</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;