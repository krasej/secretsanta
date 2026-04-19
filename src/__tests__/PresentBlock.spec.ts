import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import PresentBlock from '../components/PresentBlock.vue'

describe('PresentBlock', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
  })

  it('updates the preview image when the present prop changes', async () => {
    const wrapper = mount(PresentBlock, {
      global: {
        plugins: [createPinia()],
      },
      props: {
        present: {
          headline: 'Old present',
          description: 'Old description',
          url: '',
          image: 'https://example.com/old.png',
        },
        enableEditing: true,
        index: 0,
      },
    })

    expect(wrapper.find('img').attributes('src')).toContain('old.png')

    await wrapper.setProps({
      present: {
        headline: 'New present',
        description: 'New description',
        url: '',
        image: 'https://example.com/new.png',
      },
    })

    expect(wrapper.find('img').attributes('src')).toContain('new.png')
  })
})
