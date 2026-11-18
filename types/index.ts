export type Gender = 'male' | 'female' | 'other'
export type RelationshipType = 'marriage' | 'biological_child' | 'adopted_child'
export type UserRole = 'admin' | 'editor' | 'member'

export interface Profile {
  id: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminUserData {
  id: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Person {
  id: string
  full_name: string
  gender: Gender
  birth_year: number | null
  birth_month: number | null
  birth_day: number | null
  death_year: number | null
  death_month: number | null
  death_day: number | null
  avatar_url: string | null
  note: string | null
  created_at: string
  updated_at: string

  // Private fields (optional, as they might not be returned for members)
  phone_number?: string | null
  occupation?: string | null
  current_residence?: string | null

  // Lunar Date
  death_lunar_year: number | null
  death_lunar_month: number | null
  death_lunar_day: number | null

  // New fields
  is_deceased: boolean
  is_in_law: boolean
  birth_order: number | null
  generation: number | null
  other_names: string | null
  /** Where the member is buried; missing on databases not upgraded yet. */
  burial_place?: string | null
  /** Soft delete timestamp; null when the member is active. */
  deleted_at?: string | null
  /** User who soft-deleted the member. */
  deleted_by?: string | null
  /** Branch id of member */
  branch_id?: string | null
}

export interface Branch {
  id: string
  name: string
  parent_branch_id: string | null
  head_person_id: string | null
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface Relationship {
  id: string
  type: RelationshipType
  person_a: string // UUID
  person_b: string // UUID
  note?: string | null
  created_at: string
  updated_at: string
}

// Helper types for UI
export interface PersonWithDetails extends Person {
  spouses?: Person[]
  children?: Person[]
  parents?: Person[]
}

export interface GalleryItem {
  id: string
  title: string
  description: string | null
  image_url: string
  event_date: string | null // ISO string or date string
  created_at: string
  created_by: string | null
  // Storage path used to create signed URLs and delete the object.
  storage_path?: string
  // True when no signed URL could be made for the image (it is not shown).
  image_error?: boolean
  // Ids of the members tagged in the photo (filled by attachGalleryTags).
  person_ids?: string[]
}

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected'

export interface ChangeRequest {
  id: string
  target_person_id: string
  proposed_by_user_id: string
  proposed_data: Record<string, unknown>
  original_data?: Record<string, unknown> | null
  reason?: string | null
  proof_url?: string | null
  status: ChangeRequestStatus
  reviewed_by_user_id?: string | null
  review_note?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at: string
  // Optional display fields populated by queries/joins
  target_person_name?: string | null
  proposer_email?: string | null
  target_person?: Person | null
}

export type AuditLogAction =
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'RESTORE'
  | 'MERGE'
  | 'APPROVE_PROPOSAL'

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: AuditLogAction | string
  performed_by: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
  // Optional display fields
  performer_email?: string | null
}

