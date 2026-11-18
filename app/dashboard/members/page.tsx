import type { Metadata } from 'next'
import { Suspense } from 'react'

import { getBranches } from '@/app/actions/branch'
import MemberDetailModal from '@/components/modal/MemberDetailModal'
import MembersViews from '@/components/MembersViews'
import BranchSelector from '@/components/tree/BranchSelector'
import ViewToggle from '@/components/ViewToggle'
import { AvatarUrlProvider } from '@/context/AvatarUrlContext'
import { MemberListProvider } from '@/context/MemberListContext'
import { getServerTranslations } from '@/lib/i18n/server'
import { Person, Relationship } from '@/types'
import { NO_SIGNED_AVATAR_URLS } from '@/utils/avatar'
import { signAvatarUrls } from '@/utils/avatarSigning'
import {
  PERSON_LIST_COLUMNS,
  RELATIONSHIP_COLUMNS
} from '@/utils/personColumns'
import { fetchAllRowsOrThrow } from '@/utils/supabase/fetchAll'
import { getProfile, getSupabase } from '@/utils/supabase/queries'
import { pickDefaultRootId } from '@/utils/treeRoot'
import { parseViewMode } from '@/utils/viewMode'

interface PageProps {
  searchParams: Promise<{
    view?: string
    rootId?: string
    avatar?: string
    branchId?: string
  }>
}
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations()

  return { title: t('familyTree') }
}

export default async function FamilyTreePage({ searchParams }: PageProps) {
  const { view, rootId, avatar, branchId } = await searchParams
  const initialView = view === undefined ? undefined : parseViewMode(view)
  const initialShowAvatar = avatar !== 'hide'

  const profile = await getProfile()
  const canEdit =
    profile?.is_active === true &&
    (profile.role === 'admin' || profile.role === 'editor')

  const supabase = await getSupabase()

  const [personsRes, relsRes, branchesRes] = await Promise.all([
    fetchAllRowsOrThrow((from, to) =>
      supabase
        .from('persons')
        .select(PERSON_LIST_COLUMNS)
        .is('deleted_at', null)
        .order('birth_year', { ascending: true, nullsFirst: false })
        .order('id')
        .range(from, to)
    ),
    fetchAllRowsOrThrow((from, to) =>
      supabase
        .from('relationships')
        .select(RELATIONSHIP_COLUMNS)
        .order('created_at')
        .order('id')
        .range(from, to)
    ),
    getBranches()
  ])

  // PERSON_LIST_COLUMNS leaves out note/created_at; no view reads them.
  const persons = (personsRes.data || []) as Person[]
  // RELATIONSHIP_COLUMNS leaves out note/updated_at; no view reads them.
  const relationships = (relsRes.data || []) as Relationship[]
  const branches = branchesRes.data || []

  // One storage request signs every avatar of the tree/list/mindmap instead
  // of one /api/avatar round trip per member.
  const signedAvatarUrls = profile?.is_active
    ? await signAvatarUrls(supabase, persons)
    : NO_SIGNED_AVATAR_URLS

  // Prepare map and roots for tree views
  const personsMap = new Map()
  persons.forEach((p) => personsMap.set(p.id, p))

  let finalRootId = rootId

  // If a branch is selected with a designated head ancestor, focus on it
  if (branchId) {
    const selectedBranch = branches.find((b) => b.id === branchId)
    if (
      selectedBranch?.head_person_id &&
      personsMap.has(selectedBranch.head_person_id)
    ) {
      finalRootId = selectedBranch.head_person_id
    }
  }

  // If no rootId is provided, open on the earliest ancestor
  if (!finalRootId || !personsMap.has(finalRootId)) {
    finalRootId = pickDefaultRootId(persons, relationships)
  }

  return (
    <Suspense fallback={null}>
      <AvatarUrlProvider signedUrls={signedAvatarUrls}>
        <MemberListProvider
          initialView={initialView}
          initialRootId={finalRootId}
          initialShowAvatar={initialShowAvatar}>
          <div className='flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-4 mt-4 mb-2'>
            <ViewToggle />
            {branches.length > 0 && (
              <BranchSelector
                branches={branches}
                selectedBranchId={branchId ?? null}
              />
            )}
          </div>
          <MembersViews
            persons={persons}
            relationships={relationships}
            canEdit={canEdit}
          />

          <MemberDetailModal />
        </MemberListProvider>
      </AvatarUrlProvider>
    </Suspense>
  )
}
