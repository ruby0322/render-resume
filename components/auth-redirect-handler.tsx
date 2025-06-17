"use client";

import { useAuth } from "@/components/hooks/use-auth";
import { useEffect } from "react";

export function AuthRedirectHandler() {
  const { isAuthenticated, loading, redirectToDashboard } = useAuth();

  useEffect(() => {
    // 如果用戶已經登入且不在載入狀態，重定向到儀表板
    if (!loading && isAuthenticated) {
      redirectToDashboard();
    }
  }, [isAuthenticated, loading, redirectToDashboard]);

  return null; // 這個組件不渲染任何UI
} 