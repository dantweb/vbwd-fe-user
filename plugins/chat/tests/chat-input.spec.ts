import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatInput from '../src/ChatInput.vue'

describe('ChatInput', () => {
  const defaultProps = {
    disabled: false,
    maxLength: 4000,
    estimatedCost: 0,
    showCost: true,
  }

  const mountInput = (props = {}) => {
    return mount(ChatInput, {
      props: { ...defaultProps, ...props },
      global: {
        mocks: {
          $t: (key: string, params?: Record<string, unknown>) => {
            if (key === 'chat.estimatedCost' && params) return `Est. cost: ~${params.count} TKN`
            if (key === 'chat.placeholder') return 'Type your message...'
            if (key === 'chat.send') return 'Send'
            return key
          },
        },
      },
    })
  }

  it('should render input and send button', () => {
    const wrapper = mountInput()
    expect(wrapper.find('[data-testid="chat-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chat-send"]').exists()).toBe(true)
  })

  it('should emit send with message text', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('[data-testid="chat-input"]')
    await input.setValue('Hello world')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')

    expect(wrapper.emitted('send')).toBeTruthy()
    expect(wrapper.emitted('send')![0]).toEqual(['Hello world'])
  })

  it('should clear input after send', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('[data-testid="chat-input"]')
    await input.setValue('Hello')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')

    expect((input.element as HTMLTextAreaElement).value).toBe('')
  })

  it('should disable when disabled prop is true', () => {
    const wrapper = mountInput({ disabled: true })
    expect((wrapper.find('[data-testid="chat-input"]').element as HTMLTextAreaElement).disabled).toBe(true)
    expect((wrapper.find('[data-testid="chat-send"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('should prevent sending empty message', async () => {
    const wrapper = mountInput()
    await wrapper.find('[data-testid="chat-send"]').trigger('click')

    expect(wrapper.emitted('send')).toBeFalsy()
  })

  it('should prevent sending whitespace-only message', async () => {
    const wrapper = mountInput()
    await wrapper.find('[data-testid="chat-input"]').setValue('   ')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')

    expect(wrapper.emitted('send')).toBeFalsy()
  })

  it('should enforce max length', () => {
    const wrapper = mountInput({ maxLength: 100 })
    const textarea = wrapper.find('[data-testid="chat-input"]').element as HTMLTextAreaElement
    expect(textarea.maxLength).toBe(100)
  })

  it('should show estimated cost when showCost is true and message is not empty', async () => {
    const wrapper = mountInput({ estimatedCost: 3, showCost: true })
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')

    expect(wrapper.find('[data-testid="chat-cost"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Est. cost: ~3 TKN')
  })

  it('should hide cost when showCost is false', async () => {
    const wrapper = mountInput({ estimatedCost: 3, showCost: false })
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')

    expect(wrapper.find('[data-testid="chat-cost"]').exists()).toBe(false)
  })

  it('should hide cost when message is empty', () => {
    const wrapper = mountInput({ estimatedCost: 3, showCost: true })
    expect(wrapper.find('[data-testid="chat-cost"]').exists()).toBe(false)
  })
})
