import { beforeEach, describe, expect, it, vi } from 'vitest'

const getCurrentUser = vi.fn()

vi.mock('../firebase', () => ({
  getCurrentUser,
}))

describe('router fallback', () => {
  beforeEach(() => {
    getCurrentUser.mockReset()
  })

  it('redirects unknown routes to home for signed-in users', async () => {
    getCurrentUser.mockReturnValue({ uid: 'user-1' })

    const { default: router } = await import('../router')

    await router.push('/route-that-does-not-exist')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/')
  })
})
