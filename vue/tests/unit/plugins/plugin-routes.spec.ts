import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { PluginRegistry, PlatformSDK } from '@dantweb/view-component'
import type { IPlugin, IPlatformSDK } from '@dantweb/view-component'

const NotFoundStub = { template: '<div>404 Not Found</div>' }
const PluginPageStub = { template: '<div>Plugin Page</div>' }

function createPluginWithRoute(name: string, path: string): IPlugin {
  return {
    name,
    version: '1.0.0',
    install(sdk: IPlatformSDK) {
      sdk.addRoute({
        path,
        name,
        component: () => Promise.resolve({ default: PluginPageStub }) as Promise<{ default: unknown }>,
        meta: { requiresAuth: false }
      })
    },
    activate() {},
    deactivate() {}
  }
}

/**
 * Simulates the main.ts bootstrap flow:
 * 1. Fetch plugin registry (enabled/disabled status)
 * 2. Only register enabled plugins
 * 3. Install and add routes only for enabled plugins
 * 4. Disabled plugin routes hit the catch-all 404
 */
async function bootstrapWithRegistry(
  availablePlugins: Record<string, IPlugin>,
  pluginRegistry: Record<string, { enabled: boolean }>
) {
  const registry = new PluginRegistry()
  const sdk = new PlatformSDK()

  // Only register enabled plugins (same logic as main.ts)
  for (const [name, entry] of Object.entries(pluginRegistry)) {
    if (entry.enabled && availablePlugins[name]) {
      registry.register(availablePlugins[name])
    }
  }

  await registry.installAll(sdk)

  // Create router with catch-all 404 (same as router/index.ts)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundStub }
    ]
  })

  // Add only enabled plugin routes
  for (const route of sdk.getRoutes()) {
    router.addRoute(route as Parameters<typeof router.addRoute>[0])
  }

  return router
}

describe('Plugin Route Gating', () => {
  const landing1 = createPluginWithRoute('landing1', '/landing1')
  const checkout = createPluginWithRoute('checkout', '/checkout')

  const allPlugins: Record<string, IPlugin> = { landing1, checkout }

  it('active plugin route resolves to plugin component', async () => {
    const router = await bootstrapWithRegistry(allPlugins, {
      landing1: { enabled: true },
      checkout: { enabled: true }
    })

    await router.push('/landing1')
    expect(router.currentRoute.value.name).toBe('landing1')
    expect(router.currentRoute.value.matched[0].name).toBe('landing1')
  })

  it('disabled plugin route resolves to 404', async () => {
    const router = await bootstrapWithRegistry(allPlugins, {
      landing1: { enabled: true },
      checkout: { enabled: false }
    })

    await router.push('/checkout')
    expect(router.currentRoute.value.name).toBe('not-found')
  })

  it('uninstalled plugin route resolves to 404', async () => {
    // checkout not in registry at all (uninstalled)
    const router = await bootstrapWithRegistry(allPlugins, {
      landing1: { enabled: true }
    })

    await router.push('/checkout')
    expect(router.currentRoute.value.name).toBe('not-found')
  })

  it('all plugins disabled means all plugin routes return 404', async () => {
    const router = await bootstrapWithRegistry(allPlugins, {
      landing1: { enabled: false },
      checkout: { enabled: false }
    })

    await router.push('/landing1')
    expect(router.currentRoute.value.name).toBe('not-found')

    await router.push('/checkout')
    expect(router.currentRoute.value.name).toBe('not-found')
  })

  it('all plugins active means all plugin routes work', async () => {
    const router = await bootstrapWithRegistry(allPlugins, {
      landing1: { enabled: true },
      checkout: { enabled: true }
    })

    await router.push('/landing1')
    expect(router.currentRoute.value.name).toBe('landing1')

    await router.push('/checkout')
    expect(router.currentRoute.value.name).toBe('checkout')
  })

  it('static routes are unaffected by plugin status', async () => {
    const router = await bootstrapWithRegistry(allPlugins, {
      landing1: { enabled: false },
      checkout: { enabled: false }
    })

    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('unknown paths still resolve to 404 regardless of plugin status', async () => {
    const router = await bootstrapWithRegistry(allPlugins, {
      landing1: { enabled: true },
      checkout: { enabled: true }
    })

    await router.push('/nonexistent')
    expect(router.currentRoute.value.name).toBe('not-found')
  })
})
