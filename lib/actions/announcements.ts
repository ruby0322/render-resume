'use server';

import { createClient } from "@/lib/supabase/server";
import { AnnouncementTable } from "../types";

export async function getActiveAnnouncements(): Promise<AnnouncementTable[]> {
  const supabase = await createClient();
  
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }

  return announcements || [];
}

export interface PaginatedAnnouncements {
  announcements: AnnouncementTable[];
  totalCount: number;
  hasMore: boolean;
}

export async function getAnnouncementsPaginated(
  page: number = 1,
  limit: number = 5
): Promise<PaginatedAnnouncements> {
  const supabase = await createClient();
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 获取总数
  const { count } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // 获取分页数据
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching paginated announcements:', error);
    return {
      announcements: [],
      totalCount: 0,
      hasMore: false,
    };
  }

  const totalCount = count || 0;
  const hasMore = totalCount > page * limit;

  return {
    announcements: announcements || [],
    totalCount,
    hasMore,
  };
} 