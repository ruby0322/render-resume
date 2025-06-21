import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    
    // 獲取當前用戶
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;
    
    // 如果查看自己的資料，直接返回當前用戶資料
    if (targetUserId === currentUser.id) {
      return NextResponse.json({
        id: currentUser.id,
        email: currentUser.email,
        display_name: currentUser.user_metadata?.display_name,
        avatar_url: currentUser.user_metadata?.avatar_url,
        created_at: currentUser.created_at,
      });
    }

    // 檢查權限：只允許特定用戶查看其他人的資料
    const ADMIN_USER_ID = '049512f1-9b80-4848-9df3-03adcc8f61c9';
    if (currentUser.id !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 從 users 表獲取目標用戶資料
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single();
    
    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 返回目標用戶的公開資料
    return NextResponse.json({
      id: targetUser.id,
      email: targetUser.email,
      display_name: targetUser.display_name,
      avatar_url: targetUser.avatar_url,
      created_at: targetUser.created_at,
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 