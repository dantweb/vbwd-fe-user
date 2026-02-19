import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatMessage from '../src/ChatMessage.vue'

describe('ChatMessage', () => {
  const mountMessage = (props: { role: 'user' | 'assistant'; content: string; tokensUsed?: number }) => {
    return mount(ChatMessage, {
      props,
      global: {
        mocks: {
          $t: (key: string, params?: Record<string, unknown>) => {
            if (key === 'chat.tokensUsed' && params) return `${params.count} tokens used`
            return key
          },
        },
      },
    })
  }

  it('should render user message with correct class', () => {
    const wrapper = mountMessage({ role: 'user', content: 'Hello' })
    expect(wrapper.find('.message-user').exists()).toBe(true)
    expect(wrapper.find('.message-assistant').exists()).toBe(false)
  })

  it('should render assistant message with correct class', () => {
    const wrapper = mountMessage({ role: 'assistant', content: 'Hi there!' })
    expect(wrapper.find('.message-assistant').exists()).toBe(true)
    expect(wrapper.find('.message-user').exists()).toBe(false)
  })

  it('should display message content', () => {
    const wrapper = mountMessage({ role: 'user', content: 'Test message content' })
    expect(wrapper.text()).toContain('Test message content')
  })

  it('should display tokens used for assistant messages', () => {
    const wrapper = mountMessage({ role: 'assistant', content: 'Reply', tokensUsed: 5 })
    expect(wrapper.find('[data-testid="message-tokens"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('5 tokens used')
  })

  it('should hide tokens used when not provided', () => {
    const wrapper = mountMessage({ role: 'assistant', content: 'Reply' })
    expect(wrapper.find('[data-testid="message-tokens"]').exists()).toBe(false)
  })

  it('should hide tokens used for user messages even if provided', () => {
    const wrapper = mountMessage({ role: 'user', content: 'Hello', tokensUsed: 3 })
    expect(wrapper.find('[data-testid="message-tokens"]').exists()).toBe(false)
  })
})
