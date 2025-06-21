"use client";

import { useAuth } from "@/components/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Edit3, Mail, Save, User, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const params = useParams();
  const userId = params.id as string;
  
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError("請先登入");
        } else if (response.status === 403) {
          setError("您沒有權限查看此用戶資料");
        } else if (response.status === 404) {
          setError("用戶不存在");
        } else {
          setError("載入用戶資料失敗");
        }
        return;
      }

      const userData = await response.json();
      setProfileUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError("載入用戶資料失敗");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      setError("請先登入");
      setLoading(false);
      return;
    }

    fetchUserProfile();
  }, [currentUser, authLoading, fetchUserProfile]);

  useEffect(() => {
    if (profileUser) {
      setDisplayName(profileUser.display_name || profileUser.email?.split('@')[0] || '');
    }
  }, [profileUser]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-cyan-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
          {/* 錯誤圖標 */}
          <div className="mb-6">
            {error === "您沒有權限查看此用戶資料" ? (
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            ) : error === "用戶不存在" ? (
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            ) : error === "請先登入" ? (
              <div className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            )}
          </div>

          {/* 錯誤標題 */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {error === "您沒有權限查看此用戶資料" ? "存取被拒絕" : 
             error === "用戶不存在" ? "找不到用戶" :
             error === "請先登入" ? "需要登入" : "發生錯誤"}
          </h1>

          {/* 錯誤描述 */}
          <div className="mb-8 max-w-md">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              {error}
            </p>
            {error === "您沒有權限查看此用戶資料" && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                只有特定的管理員才能查看其他用戶的個人資料
              </p>
            )}
            {error === "用戶不存在" && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                您要查看的用戶可能已被刪除或不存在
              </p>
            )}
            {error === "請先登入" && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                您需要登入才能查看個人資料頁面
              </p>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-4">
            {error === "請先登入" ? (
              <>
                <Button 
                  asChild 
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2"
                >
                  <Link href="/auth/login">
                    立即登入
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  className="px-6 py-2"
                >
                  <Link href="/">
                    回到首頁
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  asChild 
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2"
                >
                  <Link href="/dashboard">
                    返回儀表板
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  className="px-6 py-2"
                >
                  <Link href={`/profile/${currentUser?.id}`}>
                    查看我的資料
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
          {/* 錯誤圖標 */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* 錯誤標題 */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            找不到用戶
          </h1>

          {/* 錯誤描述 */}
          <div className="mb-8 max-w-md">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              用戶不存在
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              您要查看的用戶可能已被刪除或不存在
            </p>
          </div>

          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              asChild 
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2"
            >
              <Link href="/dashboard">
                返回儀表板
              </Link>
            </Button>
            {currentUser && (
              <Button 
                asChild 
                variant="outline"
                className="px-6 py-2"
              >
                <Link href={`/profile/${currentUser.id}`}>
                  查看我的資料
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userDisplayName = profileUser.display_name || profileUser.email?.split('@')[0] || 'User';
  const initials = getInitials(userDisplayName);

  const handleSave = async () => {
    if (!isOwnProfile) return;
    
    setIsSaving(true);
    try {
      // TODO: Implement API call to update user profile
      // const response = await fetch('/api/users/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ display_name: displayName }),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      console.log('Profile updated:', { display_name: displayName });
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(profileUser.display_name || profileUser.email?.split('@')[0] || '');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isOwnProfile ? '個人資料' : `${userDisplayName} 的資料`}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isOwnProfile ? '管理您的個人資訊和帳戶設定' : '查看用戶的個人資訊'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileUser.avatar_url || undefined} alt={userDisplayName} />
                  <AvatarFallback className="bg-cyan-600 text-white text-xl font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{userDisplayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{profileUser.email}</span>
                </div>
                {profileUser.created_at && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>加入於 {formatDate(profileUser.created_at)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    基本資訊
                  </CardTitle>
                  <CardDescription>
                    {isOwnProfile ? '編輯您的個人基本資訊' : '用戶的基本資訊'}
                  </CardDescription>
                </div>
                {isOwnProfile && !isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    編輯
                  </Button>
                ) : isOwnProfile && isEditing ? (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex items-center"
                    >
                      <X className="h-4 w-4 mr-1" />
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center bg-cyan-600 hover:bg-cyan-700"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      儲存
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="display-name">顯示名稱</Label>
                  {isOwnProfile && isEditing ? (
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="輸入您的顯示名稱"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                      {userDisplayName}
                    </div>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">電子郵件</Label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400">
                    {profileUser.email}
                    {isOwnProfile && <span className="ml-2 text-xs text-gray-500">（無法修改）</span>}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="user-id">用戶 ID</Label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {profileUser.id}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>帳戶統計</CardTitle>
              <CardDescription>
                {isOwnProfile ? '您的帳戶使用情況' : '用戶的帳戶使用情況'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    0
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    已生成履歷
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {profileUser.created_at ? Math.floor((Date.now() - new Date(profileUser.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    使用天數
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 