/**
 * TDD: UserNavRegistry group support.
 *
 * Items with group:'store' should:
 * - Be returned by getGroupItems('store')
 * - NOT appear in getSidebarItems() (to avoid duplicate rendering)
 */
import { describe, it, expect, beforeEach } from 'vitest'

import { userNavRegistry } from '../../src/plugins/userNavRegistry'

describe('UserNavRegistry — group support', () => {
  beforeEach(() => {
    // Clean slate — unregister known test items
    userNavRegistry.unregister('test-plugin-a')
    userNavRegistry.unregister('test-plugin-b')
    userNavRegistry.unregister('test-plugin-c')
  })

  it('getGroupItems returns items registered with matching group', () => {
    userNavRegistry.register({ pluginName: 'test-plugin-a', to: '/store/a', labelKey: 'a', group: 'store' })
    const items = userNavRegistry.getGroupItems('store')
    expect(items.some(i => i.pluginName === 'test-plugin-a')).toBe(true)
  })

  it('getGroupItems does not return items without a group', () => {
    userNavRegistry.register({ pluginName: 'test-plugin-b', to: '/b', labelKey: 'b' })
    const items = userNavRegistry.getGroupItems('store')
    expect(items.some(i => i.pluginName === 'test-plugin-b')).toBe(false)
  })

  it('getSidebarItems does not include grouped items', () => {
    userNavRegistry.register({ pluginName: 'test-plugin-c', to: '/store/c', labelKey: 'c', group: 'store' })
    const sidebar = userNavRegistry.getSidebarItems()
    expect(sidebar.some(i => i.pluginName === 'test-plugin-c')).toBe(false)
  })

  it('externalIcon field is preserved in registration', () => {
    userNavRegistry.register({ pluginName: 'test-plugin-a', to: '/category', labelKey: 'ghrm.title', group: 'store', externalIcon: true })
    const items = userNavRegistry.getGroupItems('store')
    const item = items.find(i => i.pluginName === 'test-plugin-a')
    expect(item?.externalIcon).toBe(true)
  })
})
