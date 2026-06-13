import { useState } from 'react';
import { requestAndRegisterToken, unregisterToken } from '../services/notificationService';

export const useNotifications = (userId: string | undefined) => {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [token, setToken] = useState<string>(() => localStorage.getItem('fcm_token') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestPermission = async () => {
    if (!userId) return null;
    try {
      setLoading(true);
      setError('');
      const registeredToken = await requestAndRegisterToken(userId);
      if (registeredToken) {
        setToken(registeredToken);
        localStorage.setItem('fcm_token', registeredToken);
        setPermission(Notification.permission);
        return registeredToken;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Notification registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeToken = async () => {
    if (!userId || !token) return;
    try {
      setLoading(true);
      await unregisterToken(userId, token);
      setToken('');
      localStorage.removeItem('fcm_token');
    } catch (err: any) {
      setError(err.message || 'Failed to remove notification token.');
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    token,
    loading,
    error,
    requestPermission,
    removeToken,
  };
};
