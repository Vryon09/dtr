import React, { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginPayload, RegisterPayload, User } from '../types/auth';
import { authApi } from '../api/authApi';
import { AuthContext } from './auth-context';
import { authKeys } from '../hooks/queryKeys';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getCurrentUser();
      setUser(res.data);
      queryClient.setQueryData(authKeys.currentUser(), res.data);
    } catch {
      setUser(null);
      queryClient.setQueryData(authKeys.currentUser(), null);
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;
    authApi
      .getCurrentUser()
      .then((res) => {
        if (isMounted) {
          setUser(res.data);
          queryClient.setQueryData(authKeys.currentUser(), res.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          queryClient.setQueryData(authKeys.currentUser(), null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    setUser(res.data);
    queryClient.clear();
    queryClient.setQueryData(authKeys.currentUser(), res.data);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    setUser(res.data);
    queryClient.clear();
    queryClient.setQueryData(authKeys.currentUser(), res.data);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
