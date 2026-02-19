import type { IPlugin } from '@dantweb/view-component';
import pluginsManifest from '@plugins/plugins.json';

/**
 * Plugin Registry - Controls which hardcoded plugins are used
 *
 * Plugins MUST be imported statically for bundling, but we use
 * plugins.json to control which ones are registered and activated.
 *
 * To add a new plugin:
 * 1. Create the plugin in /plugins/{name}/
 * 2. Add static import below
 * 3. Add to pluginMap
 * 4. Add entry to plugins.json with enabled: true
 */

interface PluginManifest {
  plugins: Record<string, {
    enabled: boolean;
    version: string;
    installedAt: string;
    source: string;
  }>;
}

// ============================================================================
// STATIC PLUGIN IMPORTS - All available plugins must be imported here
// These are bundled at build time, not dynamically loaded at runtime
// ============================================================================
import { landing1Plugin } from '@plugins/landing1';
import { checkoutPlugin } from '@plugins/checkout';
import { stripePaymentPlugin } from '@plugins/stripe-payment';
import { paypalPaymentPlugin } from '@plugins/paypal-payment';
import { yookassaPaymentPlugin } from '@plugins/yookassa-payment';
import { themeSwitcherPlugin } from '@plugins/theme-switcher';
import { chatPlugin } from '@plugins/chat';
import { taroPlugin } from '@plugins/taro';

// Map of all available plugins
const pluginMap: Record<string, IPlugin> = {
  landing1: landing1Plugin,
  checkout: checkoutPlugin,
  'stripe-payment': stripePaymentPlugin,
  'paypal-payment': paypalPaymentPlugin,
  'yookassa-payment': yookassaPaymentPlugin,
  'theme-switcher': themeSwitcherPlugin,
  chat: chatPlugin,
  taro: taroPlugin,
};

/**
 * Get enabled plugins based on plugins.json configuration
 *
 * Plugins are always bundled, but only enabled ones are registered.
 * To enable/disable plugins, edit plugins.json without touching code.
 *
 * @returns Array of enabled plugin objects
 */
export function getEnabledPlugins(): IPlugin[] {
  try {
    const manifest: PluginManifest = pluginsManifest as PluginManifest;
    const enabledPlugins: IPlugin[] = [];

    for (const [pluginName, pluginConfig] of Object.entries(manifest.plugins)) {
      if (!pluginConfig.enabled) {
        console.debug(`[PluginRegistry] Skipping disabled plugin: ${pluginName}`);
        continue;
      }

      const plugin = pluginMap[pluginName];
      if (!plugin) {
        console.warn(`[PluginRegistry] Plugin '${pluginName}' in manifest not found in plugin map. Skipping.`);
        continue;
      }

      console.debug(`[PluginRegistry] Enabled plugin: ${plugin.name} (v${plugin.version || 'unknown'})`);
      enabledPlugins.push(plugin);
    }

    console.log(`[PluginRegistry] Total enabled plugins: ${enabledPlugins.length}`);
    return enabledPlugins;
  } catch (error) {
    console.error('[PluginRegistry] Failed to get enabled plugins:', error);
    return [];
  }
}

/**
 * Get list of enabled plugin names from manifest
 * Useful for checking if specific plugins are enabled
 */
export function getEnabledPluginNames(): Set<string> {
  try {
    const manifest: PluginManifest = pluginsManifest as PluginManifest;
    return new Set(
      Object.entries(manifest.plugins)
        .filter(([, config]) => config.enabled)
        .map(([name]) => name)
    );
  } catch (error) {
    console.error('[PluginRegistry] Failed to get enabled plugin names:', error);
    return new Set();
  }
}

/**
 * @deprecated Use getEnabledPlugins() instead
 */
export async function loadEnabledPlugins(): Promise<IPlugin[]> {
  return getEnabledPlugins();
}
