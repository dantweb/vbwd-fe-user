import { describe, it, expect } from 'vitest'
import { PluginRegistry, PlatformSDK } from '@dantweb/view-component'
import { chatPlugin } from '../index'

describe('Chat Plugin', () => {
  let registry: PluginRegistry
  let sdk: PlatformSDK

  beforeEach(() => {
    registry = new PluginRegistry()
    sdk = new PlatformSDK()
  })

  it('should have correct metadata', () => {
    expect(chatPlugin.name).toBe('chat')
    expect(chatPlugin.version).toBe('1.0.0')
  })

  it('should register chat route on install', async () => {
    registry.register(chatPlugin)
    await registry.installAll(sdk)

    const routes = sdk.getRoutes()
    const route = routes.find(r => r.path === '/dashboard/chat')
    expect(route).toBeDefined()
    expect(route!.name).toBe('chat')
  })

  it('should require auth on chat route', async () => {
    registry.register(chatPlugin)
    await registry.installAll(sdk)

    const routes = sdk.getRoutes()
    const route = routes.find(r => r.path === '/dashboard/chat')
    expect(route!.meta?.requiresAuth).toBe(true)
  })

  it('should add english translations on install', async () => {
    registry.register(chatPlugin)
    await registry.installAll(sdk)

    const translations = sdk.getTranslations()
    expect(translations['en']).toBeDefined()
    expect(translations['en'].chat).toBeDefined()
    expect(translations['en'].chat.title).toBe('Chat')
  })

  it('should add german translations on install', async () => {
    registry.register(chatPlugin)
    await registry.installAll(sdk)

    const translations = sdk.getTranslations()
    expect(translations['de']).toBeDefined()
    expect(translations['de'].chat).toBeDefined()
    expect(translations['de'].chat.send).toBe('Senden')
  })

  it('should set active status on activate', async () => {
    registry.register(chatPlugin)
    await registry.installAll(sdk)
    await registry.activate('chat')

    const meta = registry.get('chat')
    expect(meta?.status).toBe('ACTIVE')
  })

  it('should set inactive status on deactivate', async () => {
    registry.register(chatPlugin)
    await registry.installAll(sdk)
    await registry.activate('chat')
    await registry.deactivate('chat')

    const meta = registry.get('chat')
    expect(meta?.status).toBe('INACTIVE')
  })

  it('should complete full lifecycle without errors', async () => {
    registry.register(chatPlugin)
    await registry.installAll(sdk)
    await registry.activate('chat')
    await registry.deactivate('chat')

    expect(true).toBe(true)
  })
})
