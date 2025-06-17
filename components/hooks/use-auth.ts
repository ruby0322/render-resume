"use client";

import { createClient } from "@/lib/supabase/client";
import { AuthError, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 獲取初始認證狀態
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null,
        });
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : '獲取認證狀態失敗',
        });
      }
    };

    getInitialSession();

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 [Auth] State changed:', event, session?.user?.email);
        
        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null,
        });

        // 根據認證事件進行導航（僅在特定情況下）
        if (event === 'SIGNED_IN' && session?.user) {
          // 如果在認證頁面，導航到儀表板
          const currentPath = window.location.pathname;
          if (currentPath.startsWith('/auth/')) {
            router.push('/dashboard');
          }
        } else if (event === 'SIGNED_OUT') {
          // 登出時導航到首頁（如果不在首頁或認證頁面）
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/auth/') && currentPath !== '/') {
            router.push('/');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // 電子郵件密碼登入
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ [Auth] Email sign in successful');
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : '登入失敗，請重試';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Google OAuth 登入
  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      console.log('🚀 [Auth] Google OAuth initiated');
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : 'Google 登入失敗，請重試';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // 電子郵件註冊
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      console.log('✅ [Auth] Email sign up successful');
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : '註冊失敗，請重試';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // 登出
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      console.log('👋 [Auth] Sign out successful');
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : '登出失敗，請重試';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // 重置密碼
  const resetPassword = async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      console.log('📧 [Auth] Password reset email sent');
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : '重置密碼失敗，請重試';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // 清除錯誤
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
    resetPassword,
    clearError,
  };
} 