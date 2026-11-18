import type { SupabaseClient } from '@supabase/supabase-js'

import { getAvatarStoragePath } from '@/utils/avatar'
import { PersonNotDeletedError } from '@/utils/writeErrors'

export interface DeleteMemberOptions {
  /** If true (default), marks deleted_at instead of permanently removing the row. */
  soft?: boolean
  /** The user ID requesting the deletion, recorded in deleted_by when soft deleting. */
  deletedBy?: string | null
}

/**
 * Deletes a member:
 * - When soft=true (default): updates deleted_at timestamp and deleted_by user.
 *   Avatar file is kept so the profile can be restored without loss.
 * - When soft=false: hard-deletes the row first, then deletes the avatar file from Storage.
 */
export async function deleteMember(
  supabase: SupabaseClient,
  memberId: string,
  options?: DeleteMemberOptions
): Promise<{ fileRemoved: boolean }> {
  const isSoft = options?.soft !== false

  if (isSoft) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('persons')
      .update({
        deleted_at: now,
        deleted_by: options?.deletedBy ?? null
      })
      .eq('id', memberId)
      .select('id')
    if (error) throw error
    if (!data || data.length === 0) throw new PersonNotDeletedError()

    return { fileRemoved: false }
  }

  const { data: person, error: loadError } = await supabase
    .from('persons')
    .select('avatar_url')
    .eq('id', memberId)
    .maybeSingle()
  if (loadError) throw loadError

  const { data, error } = await supabase
    .from('persons')
    .delete()
    .eq('id', memberId)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new PersonNotDeletedError()

  const storagePath = getAvatarStoragePath(
    (person as { avatar_url?: string | null } | null)?.avatar_url
  )
  if (!storagePath) return { fileRemoved: true }

  try {
    const { error: fileError } = await supabase.storage
      .from('avatars')
      .remove([storagePath])
    if (fileError) throw fileError
    return { fileRemoved: true }
  } catch (err) {
    console.error('Avatar file was not removed', storagePath, err)
    return { fileRemoved: false }
  }
}

/**
 * Restores a soft-deleted member by clearing deleted_at and deleted_by.
 */
export async function restoreMember(
  supabase: SupabaseClient,
  memberId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('persons')
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', memberId)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Member not found or not in trash.')
  }
}
