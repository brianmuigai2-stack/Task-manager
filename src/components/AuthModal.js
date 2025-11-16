import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, normalizeUsername, usernameToEmail, createUserFirestore } from '../services/firebase';

const AuthModal = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedUsername = normalizeUsername(username);
    const email = usernameToEmail(normalizedUsername);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const result = await createUserFirestore(userCredential.user.uid, normalizedUsername, username);
        if (!result.ok) {
          setError('Failed to create user profile');
          return;
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content auth-content">
        <h1>{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="auth-username">Username</label>
            <input
              type="text"
              id="auth-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              type="password"
              id="auth-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
          <p className="auth-switch">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a href="#" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;