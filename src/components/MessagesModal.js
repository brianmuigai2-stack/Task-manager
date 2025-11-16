import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, or, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

const MessagesModal = ({ isOpen, onClose, user, userDoc }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.userId);
    }
  }, [selectedConversation]);

  const loadConversations = () => {
    const q = query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', user.uid),
        where('receiverId', '==', user.uid)
      )
    );

    return onSnapshot(q, (snapshot) => {
      const messagesByUser = {};
      
      snapshot.docs.forEach(doc => {
        const message = { id: doc.id, ...doc.data() };
        const otherUserId = message.senderId === user.uid ? message.receiverId : message.senderId;
        
        if (!messagesByUser[otherUserId] || (message.createdAt?.seconds || 0) > (messagesByUser[otherUserId].createdAt?.seconds || 0)) {
          messagesByUser[otherUserId] = {
            ...message,
            userId: otherUserId,
            userName: message.senderId === user.uid ? 'You' : message.senderName,
            userPicture: message.senderId === user.uid ? userDoc?.profilePicture : message.senderPicture,
            isUnread: message.receiverId === user.uid && !message.read
          };
        }
      });

      const conversationsList = Object.values(messagesByUser);
      conversationsList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setConversations(conversationsList);
    }, (error) => {
      console.warn('Messages access denied:', error);
      setConversations([]);
    });
  };

  const loadMessages = (otherUserId) => {
    const q = query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', user.uid),
        where('receiverId', '==', user.uid)
      )
    );

    return onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const conversationMessages = allMessages.filter(msg => 
        (msg.senderId === user.uid && msg.receiverId === otherUserId) ||
        (msg.senderId === otherUserId && msg.receiverId === user.uid)
      ).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      
      setMessages(conversationMessages);
      
      // Mark messages as read
      conversationMessages.forEach(msg => {
        if (msg.receiverId === user.uid && !msg.read) {
          updateDoc(doc(db, 'messages', msg.id), { read: true }).catch(err => 
            console.warn('Could not mark message as read:', err)
          );
        }
      });
    }, (error) => {
      console.warn('Messages access denied:', error);
      setMessages([]);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        senderName: userDoc?.displayName || userDoc?.username,
        senderPicture: userDoc?.profilePicture || '',
        receiverId: selectedConversation.userId,
        text: newMessage,
        read: false,
        createdAt: new Date()
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content messages-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>💬 Messages</h2>
        
        <div className="messages-container">
          <div className="conversations-list">
            <h3>Conversations</h3>
            {conversations.length > 0 ? (
              conversations.map(conv => (
                <div 
                  key={conv.userId}
                  className={`conversation-item ${selectedConversation?.userId === conv.userId ? 'active' : ''} ${conv.isUnread ? 'unread' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="conversation-avatar">
                    {conv.userPicture ? (
                      <img src={conv.userPicture} alt="User" />
                    ) : (
                      <div className="default-avatar">
                        {(conv.senderName || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-name">{conv.senderName}</div>
                    <div className="conversation-preview">{conv.text}</div>
                    <small>{new Date(conv.createdAt.seconds * 1000).toLocaleString()}</small>
                  </div>
                  {conv.isUnread && <div className="unread-indicator"></div>}
                </div>
              ))
            ) : (
              <p>No conversations yet</p>
            )}
          </div>

          <div className="chat-area">
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <h4>Chat with {selectedConversation.senderName}</h4>
                </div>
                
                <div className="messages-list">
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      className={`message-item ${message.senderId === user.uid ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{message.text}</p>
                        <small>{new Date(message.createdAt.seconds * 1000).toLocaleString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="message-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage();
                      }
                    }}
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="btn btn-primary"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="no-chat-selected">
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesModal;