import { describe, expect, test } from 'bun:test'

import { fakeSupabase } from '@/utils/testing/fakeSupabase'

import { deleteMember, restoreMember } from './deleteMember'
import { PersonNotDeletedError } from './writeErrors'

describe('deleteMember', () => {
  test('soft-deletes by default: marks deleted_at, keeps avatar file', async () => {
    const { client, calls } = fakeSupabase((call) =>
      call.op === 'update' ? { data: [{ id: 'p1' }] } : { data: null }
    )
    await expect(deleteMember(client, 'p1', { deletedBy: 'user-admin' })).resolves.toEqual({
      fileRemoved: false
    })
    expect(calls.map((c) => c.op)).toEqual(['update'])
    expect(calls[0].table).toBe('persons')
    expect((calls[0].payload as { deleted_by?: string })?.deleted_by).toBe('user-admin')
  })

  test('hard-deletes when soft=false: deletes row and avatar file', async () => {
    const { client, calls } = fakeSupabase((call) =>
      call.op === 'delete'
        ? { data: [{ id: 'p1' }] }
        : { data: { avatar_url: 'p1_an.jpg' } }
    )
    await expect(
      deleteMember(client, 'p1', { soft: false })
    ).resolves.toEqual({
      fileRemoved: true
    })
    expect(calls.map((c) => c.op)).toEqual(['select', 'delete', 'remove'])
    expect(calls[2].table).toBe('storage:avatars')
    expect(calls[2].payload).toEqual([['p1_an.jpg']])
  })

  test('zero rows on soft-delete throws PersonNotDeletedError', async () => {
    const { client, calls } = fakeSupabase((call) =>
      call.op === 'update' ? { data: [] } : { data: null }
    )
    await expect(deleteMember(client, 'p1')).rejects.toBeInstanceOf(
      PersonNotDeletedError
    )
    expect(calls.map((c) => c.op)).toEqual(['update'])
  })

  test('zero rows on hard-delete (RLS) throws and keeps the file', async () => {
    const { client, calls } = fakeSupabase((call) =>
      call.op === 'delete' ? { data: [] } : { data: { avatar_url: 'a.jpg' } }
    )
    await expect(
      deleteMember(client, 'p1', { soft: false })
    ).rejects.toBeInstanceOf(PersonNotDeletedError)
    expect(calls.map((c) => c.op)).toEqual(['select', 'delete'])
  })

  test('restoreMember resets deleted_at and deleted_by to null', async () => {
    const { client, calls } = fakeSupabase((call) =>
      call.op === 'update' ? { data: [{ id: 'p1' }] } : { data: null }
    )
    await expect(restoreMember(client, 'p1')).resolves.toBeUndefined()
    expect(calls.map((c) => c.op)).toEqual(['update'])
    expect(calls[0].table).toBe('persons')
    expect((calls[0].payload as { deleted_at?: unknown })?.deleted_at).toBeNull()
  })
})
