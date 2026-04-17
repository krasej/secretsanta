import { describe, it, expect, vi } from 'vitest'
import { createPinia } from 'pinia'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('App', () => {
  it('renders the app shell', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        stubs: ['RouterLink', 'RouterView'],
      },
    })

    expect(wrapper.html()).toContain('app-shell')
    expect(wrapper.html()).toContain('router-view-stub')
  })
})
