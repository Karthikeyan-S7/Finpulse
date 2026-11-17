import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usersApi } from '../api/users';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 1,
  username: 'aarav_sharma',
  fullName: 'Aarav Sharma',
  email: 'aarav.sharma@example.in',
  currency: 'INR',
  locale: 'en-IN',
};

export function AuthProvider({ children }) {
  const [userId, setUserIdState] = useState(() => {
    const saved = localStorage.getItem('finpulse-user-id');
    return saved ? Number(saved) : 1;
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('finpulse-user-pref');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore JSON parse error
    }
    return DEFAULT_USER;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async (idToFetch) => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getById(idToFetch);
      if (data) {
        setUser(data);
        localStorage.setItem('finpulse-user-pref', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not load user from API, using fallback profile:', err.message);
      if (idToFetch === 2) {
        const u2 = {
          id: 2,
          username: 'sarah_connor',
          fullName: 'Sarah Connor',
          email: 'sarah.c@example.in',
          currency: 'INR',
          locale: 'en-IN',
        };
        setUser(u2);
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  const switchUser = (newId) => {
    const numericId = Number(newId);
    setUserIdState(numericId);
    localStorage.setItem('finpulse-user-id', String(numericId));
  };

  const updateProfile = async (updateData) => {
    try {
      const updated = await usersApi.update(userId, updateData);
      setUser(updated);
      try {
        localStorage.setItem('finpulse-user-pref', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const refreshUser = () => fetchUser(userId);

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        currentUser: user, // backward-compatibility alias
        switchUser,
        updateProfile,
        refreshUser,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
