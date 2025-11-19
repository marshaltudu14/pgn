import { createClient } from '@supabase/supabase-js';

// IMPORTANT: This should only be used in server-side service files
// Never expose this to client components or API routes that don't validate access

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables for admin operations'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a new user in Supabase Auth
 * This should only be called from validated server-side services
 */
export async function createAuthUser(
  email: string,
  password: string
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for employee creation
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating auth user:', error);
    return { success: false, error };
  }
}

/**
 * Reset user password
 * This should only be called from validated server-side services
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      }
    );

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error };
  }
}

/**
 * Update user email
 * This should only be called from validated server-side services
 */
export async function updateUserEmail(userId: string, newEmail: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email: newEmail,
        email_confirm: true,
      }
    );

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating user email:', error);
    return { success: false, error };
  }
}
