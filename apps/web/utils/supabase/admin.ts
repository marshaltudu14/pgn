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

/**
 * Get user by email
 * This should only be called from validated server-side services
 */
export async function getUserByEmail(email: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      filters: {
        email: email.toLowerCase().trim()
      }
    });

    if (error) {
      throw error;
    }

    // Return the first user if found, otherwise return null
    return { success: true, data: data.users.length > 0 ? data.users[0] : null };
  } catch (error) {
    console.error('Error getting user by email:', error);
    return { success: false, error };
  }
}

/**
 * Update user password by email
 * This should only be called from validated server-side services
 */
export async function updateUserPasswordByEmail(email: string, newPassword: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // First get the user by email
    const userResult = await getUserByEmail(email);

    if (!userResult.success) {
      return { success: false, error: userResult.error as string };
    }

    if (!userResult.data) {
      return { success: false, error: 'User not found with this email' };
    }

    // Update the password using the user ID
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userResult.data.id,
      {
        password: newPassword,
      }
    );

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating user password by email:', error);
    return { success: false, error };
  }
}
