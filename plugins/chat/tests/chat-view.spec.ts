import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockSendMessage = vi.fn()
const mockGetChatConfig = vi.fn()
const mockEstimateCost = vi.fn()

vi.mock('../src/api', () => ({
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
  getChatConfig: (...args: unknown[]) => mockGetChatConfig(...args),
  estimateCost: (...args: unknown[]) => mockEstimateCost(...args),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'chat.tokensUsed' && params) return `${params.count} tokens used`
      if (key === 'chat.estimatedCost' && params) return `Est. cost: ~${params.count} TKN`
      if (key === 'chat.placeholder') return 'Type your message...'
      if (key === 'chat.send') return 'Send'
      if (key === 'chat.emptyState') return 'Start a conversation'
      if (key === 'chat.title') return 'Chat'
      if (key === 'chat.balance') return 'Balance'
      if (key === 'chat.model') return 'Model'
      if (key === 'chat.clearChat') return 'Clear Chat'
      if (key === 'chat.insufficientBalance') return 'Insufficient balance'
      if (key === 'chat.errorSending') return 'Failed to send'
      if (key === 'common.tokenUnit') return 'TKN'
      return key
    },
  }),
}))

import ChatView from '../src/ChatView.vue'

describe('ChatView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetChatConfig.mockResolvedValue({
      model: 'gpt-4o-mini',
      max_message_length: 4000,
      counting_mode: 'words',
    })

    // Mock fetch for balance endpoint
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/tokens/balance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ balance: 1000 }),
        })
      }
      return Promise.reject(new Error('Not mocked'))
    }) as ReturnType<typeof vi.fn>

    localStorage.setItem('auth_token', 'test-token')
  })

  const mountView = async () => {
    const wrapper = mount(ChatView, {
      global: {
        mocks: {
          $t: (key: string, params?: Record<string, unknown>) => {
            if (key === 'chat.tokensUsed' && params) return `${params.count} tokens used`
            if (key === 'chat.estimatedCost' && params) return `Est. cost: ~${params.count} TKN`
            if (key === 'chat.placeholder') return 'Type your message...'
            if (key === 'chat.send') return 'Send'
            if (key === 'chat.emptyState') return 'Start a conversation'
            if (key === 'chat.title') return 'Chat'
            if (key === 'chat.balance') return 'Balance'
            if (key === 'chat.model') return 'Model'
            if (key === 'chat.clearChat') return 'Clear Chat'
            if (key === 'chat.insufficientBalance') return 'Insufficient balance'
            if (key === 'chat.errorSending') return 'Failed to send'
            if (key === 'common.tokenUnit') return 'TKN'
            return key
          },
        },
      },
    })
    await flushPromises()
    return wrapper
  }

  it('should render chat container', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="chat-container"]').exists()).toBe(true)
  })

  it('should display empty state initially', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="chat-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Start a conversation')
  })

  it('should fetch config on mount', async () => {
    await mountView()
    expect(mockGetChatConfig).toHaveBeenCalledOnce()
  })

  it('should fetch balance on mount', async () => {
    await mountView()
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/user/tokens/balance',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    )
  })

  it('should display balance from API', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="chat-balance"]').text()).toContain('1000')
  })

  it('should display model name', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="chat-model"]').text()).toContain('gpt-4o-mini')
  })

  it('should send message and display response', async () => {
    mockSendMessage.mockResolvedValue({
      response: 'Hello from AI',
      tokens_used: 5,
      balance: 995,
    })

    const wrapper = await mountView()

    // Type and send
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')
    await flushPromises()

    // User message should appear
    expect(wrapper.find('[data-testid="chat-message-user"]').exists()).toBe(true)
    // Assistant response should appear
    expect(wrapper.find('[data-testid="chat-message-assistant"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Hello from AI')
  })

  it('should update balance after send', async () => {
    mockSendMessage.mockResolvedValue({
      response: 'Reply',
      tokens_used: 5,
      balance: 995,
    })

    const wrapper = await mountView()
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="chat-balance"]').text()).toContain('995')
  })

  it('should show loading indicator while sending', async () => {
    let resolvePromise: (value: unknown) => void
    mockSendMessage.mockReturnValue(new Promise(resolve => { resolvePromise = resolve }))

    const wrapper = await mountView()
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')

    // Should show loading before response
    await flushPromises()
    expect(wrapper.find('[data-testid="chat-loading"]').exists()).toBe(true)

    // Resolve the promise
    resolvePromise!({ response: 'Done', tokens_used: 1, balance: 999 })
    await flushPromises()

    expect(wrapper.find('[data-testid="chat-loading"]').exists()).toBe(false)
  })

  it('should disable input while sending', async () => {
    let resolvePromise: (value: unknown) => void
    mockSendMessage.mockReturnValue(new Promise(resolve => { resolvePromise = resolve }))

    const wrapper = await mountView()
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')
    await flushPromises()

    expect((wrapper.find('[data-testid="chat-input"]').element as HTMLTextAreaElement).disabled).toBe(true)

    resolvePromise!({ response: 'Done', tokens_used: 1, balance: 999 })
    await flushPromises()

    expect((wrapper.find('[data-testid="chat-input"]').element as HTMLTextAreaElement).disabled).toBe(false)
  })

  it('should display insufficient balance error', async () => {
    mockSendMessage.mockRejectedValue({ error: 'Insufficient token balance' })

    const wrapper = await mountView()
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="chat-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Insufficient balance')
  })

  it('should display generic error on LLM failure', async () => {
    mockSendMessage.mockRejectedValue({ error: 'LLM API error' })

    const wrapper = await mountView()
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="chat-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to send')
  })

  it('should clear chat on clear button click', async () => {
    mockSendMessage.mockResolvedValue({
      response: 'Reply',
      tokens_used: 1,
      balance: 999,
    })

    const wrapper = await mountView()

    // Send a message first
    await wrapper.find('[data-testid="chat-input"]').setValue('Hello')
    await wrapper.find('[data-testid="chat-send"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="chat-message-user"]').exists()).toBe(true)

    // Clear
    await wrapper.find('[data-testid="chat-clear"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="chat-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chat-message-user"]').exists()).toBe(false)
  })
})
