import { createClient } from "@/lib/supabase/server";
import { UserInsert, UserTable } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already exists in the database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing user:', fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    let userData: UserTable;

    if (!existingUser) {
      // Create new user
      const displayName = authUser.user_metadata?.full_name || 
                         authUser.user_metadata?.name || 
                         authUser.email?.split('@')[0] || 
                         'User';
      
      const avatarUrl = authUser.user_metadata?.avatar_url || 
                       authUser.user_metadata?.picture || 
                       null;

      const newUserData: UserInsert = {
        id: authUser.id, // Use the same UUID from auth
        display_name: displayName,
        avatar_url: avatarUrl,
        email: authUser.email,
      };

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(newUserData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      userData = newUser;
    } else {
      // Update existing user with latest data from auth
      const displayName = authUser.user_metadata?.full_name || 
                         authUser.user_metadata?.name || 
                         existingUser.display_name ||
                         authUser.email?.split('@')[0] || 
                         'User';
      
      const avatarUrl = authUser.user_metadata?.avatar_url || 
                       authUser.user_metadata?.picture || 
                       existingUser.avatar_url;

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          email: authUser.email,
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
      }

      userData = updatedUser;
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 