"use client";

import { createClient } from "@/lib/supabase/client";
import { AuthError, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// Extended User type to include database user data
interface ExtendedUser extends User {
  display_name?: string;
  avatar_url?: string;
  email?: string;
}

interface AuthState {
  user: ExtendedUser | null;
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

  // Function to sync user data with database
  const syncUserData = useCallback(async (authUser: User): Promise<ExtendedUser> => {
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const { user: dbUser } = await response.json();
        return { 
          ...authUser, 
          display_name: dbUser.display_name,
          avatar_url: dbUser.avatar_url,
          email: dbUser.email
        };
      } else {
        console.error('Failed to sync user data:', await response.text());
        return authUser as ExtendedUser;
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      return authUser as ExtendedUser;
    }
  }, []);

  useEffect(() => {
    // 獲取初始認證狀態
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          // Sync user data with database
          const syncedUser = await syncUserData(session.user);
          setAuthState({
            user: syncedUser,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
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
      async (event, session) => {
        console.log('🔐 [Auth] State changed:', event, session?.user?.email);
        
        if (session?.user) {
          // Sync user data with database for sign in events
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const syncedUser = await syncUserData(session.user);
            setAuthState({
              user: syncedUser,
              loading: false,
              error: null,
            });
          } else {
            setAuthState({
              user: session.user as ExtendedUser,
              loading: false,
              error: null,
            });
          }
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
        
        // 如果是新用戶註冊（包括 Google OAuth），發送歡迎郵件
        if (event === 'SIGNED_IN' && session?.user?.email) {
          // 檢查是否為新用戶（可以通過檢查 created_at 是否與當前時間接近來判斷）
          const userCreatedAt = new Date(session.user.created_at);
          const now = new Date();
          const timeDifference = now.getTime() - userCreatedAt.getTime();
          const isNewUser = timeDifference < 60000; // 如果創建時間在1分鐘內，視為新用戶
          
          if (isNewUser) {
            try {
              const userName = session.user.user_metadata?.full_name || 
                             session.user.user_metadata?.name || 
                             session.user.email.split('@')[0];
              
              const response = await fetch('/api/send-waitlist-welcome', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: session.user.email,
                  userName,
                }),
              });
              
              if (response.ok) {
                console.log('✅ [Auth] Waitlist welcome email sent for new user');
              } else {
                console.warn('⚠️ [Auth] Failed to send waitlist welcome email for new user:', await response.text());
              }
            } catch (emailError) {
              console.error('❌ [Auth] Error sending waitlist welcome email for new user:', emailError);
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, syncUserData]);

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
          redirectTo: `${window.location.origin}/auth/login`,
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
          emailRedirectTo: `${window.location.origin}/auth/sign-up`,
        },
      });
      
      if (error) throw error;
      
      console.log('✅ [Auth] Email sign up successful');
      
      // 發送 Wait List 歡迎郵件
      try {
        const userName = email.split('@')[0]; // 從電子郵件提取用戶名
        
        const response = await fetch('/api/send-waitlist-welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            userName,
          }),
        });
        
        if (response.ok) {
          console.log('✅ [Auth] Waitlist welcome email sent successfully');
        } else {
          console.warn('⚠️ [Auth] Failed to send waitlist welcome email:', await response.text());
        }
      } catch (emailError) {
        // 即使發送郵件失敗，也不應該影響註冊流程
        console.error('❌ [Auth] Error sending waitlist welcome email:', emailError);
      }
      
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

  // 手動重定向方法
  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  const redirectToHome = () => {
    router.push('/');
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
    redirectToDashboard,
    redirectToHome,
  };
} 