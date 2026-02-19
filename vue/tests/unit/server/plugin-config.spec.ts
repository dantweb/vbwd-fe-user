import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// We need to test the PluginConfigService
async function getService() {
  const { PluginConfigService } = await import('../../../../server/services/plugin-config');
  return PluginConfigService;
}

describe('PluginConfigService', () => {
  let testDir: string;
  let PluginConfigService: Awaited<ReturnType<typeof getService>>;

  beforeEach(async () => {
    PluginConfigService = await getService();
    testDir = join(tmpdir(), `vbwd-test-plugins-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create test plugin directories
    mkdirSync(join(testDir, 'test-plugin'), { recursive: true });
    writeFileSync(join(testDir, 'test-plugin', 'index.ts'), `
export const testPlugin = {
  name: 'test-plugin',
  version: '1.0.0',
  description: 'A test plugin for unit testing',
};
`);
    writeFileSync(join(testDir, 'test-plugin', 'config.json'), JSON.stringify({
      title: { type: 'string', default: 'Default', description: 'Main title' },
      enabled: { type: 'boolean', default: true, description: 'Enable feature' }
    }));
    writeFileSync(join(testDir, 'test-plugin', 'admin-config.json'), JSON.stringify({
      tabs: [{ id: 'general', label: 'General', fields: [
        { key: 'title', label: 'Title', component: 'input', inputType: 'text' },
        { key: 'enabled', label: 'Enabled', component: 'checkbox' }
      ]}]
    }));

    // Create plugins.json
    writeFileSync(join(testDir, 'plugins.json'), JSON.stringify({
      plugins: {
        'test-plugin': {
          enabled: true,
          version: '1.0.0',
          installedAt: '2026-02-11T00:00:00.000Z',
          source: 'local'
        }
      }
    }));

    // Create config.json
    writeFileSync(join(testDir, 'config.json'), JSON.stringify({
      'test-plugin': { title: 'Custom Title' }
    }));
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('should list plugins from filesystem', () => {
    const service = new PluginConfigService(testDir);
    const plugins = service.listPlugins();

    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe('test-plugin');
    expect(plugins[0].version).toBe('1.0.0');
    expect(plugins[0].status).toBe('active');
    expect(plugins[0].hasConfig).toBe(true);
  });

  it('should return plugin detail with config schema and saved config', () => {
    const service = new PluginConfigService(testDir);
    const detail = service.getPluginDetail('test-plugin');

    expect(detail).not.toBeNull();
    expect(detail!.name).toBe('test-plugin');
    expect(detail!.configSchema).toHaveProperty('title');
    expect(detail!.adminConfig.tabs).toHaveLength(1);
    expect(detail!.savedConfig).toEqual({ title: 'Custom Title' });
  });

  it('should return null for non-existent plugin', () => {
    const service = new PluginConfigService(testDir);
    const detail = service.getPluginDetail('nonexistent');
    expect(detail).toBeNull();
  });

  it('should save plugin config', () => {
    const service = new PluginConfigService(testDir);
    const result = service.savePluginConfig('test-plugin', { title: 'New Title', enabled: false });

    expect(result).toBe(true);

    const detail = service.getPluginDetail('test-plugin');
    expect(detail!.savedConfig).toEqual({ title: 'New Title', enabled: false });
  });

  it('should return false when saving config for non-existent plugin', () => {
    const service = new PluginConfigService(testDir);
    const result = service.savePluginConfig('nonexistent', { key: 'value' });
    expect(result).toBe(false);
  });

  it('should enable plugin', () => {
    const service = new PluginConfigService(testDir);
    service.disablePlugin('test-plugin');

    let detail = service.getPluginDetail('test-plugin');
    expect(detail!.status).toBe('inactive');

    service.enablePlugin('test-plugin');
    detail = service.getPluginDetail('test-plugin');
    expect(detail!.status).toBe('active');
  });

  it('should disable plugin', () => {
    const service = new PluginConfigService(testDir);
    service.disablePlugin('test-plugin');

    const detail = service.getPluginDetail('test-plugin');
    expect(detail!.status).toBe('inactive');
  });

  it('should return false when enabling non-installed plugin', () => {
    const service = new PluginConfigService(testDir);
    expect(service.enablePlugin('nonexistent')).toBe(false);
  });

  it('should install a plugin that exists on disk but not in registry', () => {
    // Create another plugin on disk
    mkdirSync(join(testDir, 'new-plugin'), { recursive: true });
    writeFileSync(join(testDir, 'new-plugin', 'index.ts'), `
export const newPlugin = {
  name: 'new-plugin',
  version: '2.0.0',
  description: 'A new plugin',
};
`);

    const service = new PluginConfigService(testDir);
    const result = service.installPlugin('new-plugin');

    expect(result).toBe(true);

    const plugins = service.listPlugins();
    const newPlugin = plugins.find(p => p.name === 'new-plugin');
    expect(newPlugin).toBeDefined();
    expect(newPlugin!.status).toBe('inactive');
  });

  it('should return false when installing already installed plugin', () => {
    const service = new PluginConfigService(testDir);
    expect(service.installPlugin('test-plugin')).toBe(false);
  });

  it('should uninstall plugin', () => {
    const service = new PluginConfigService(testDir);
    const result = service.uninstallPlugin('test-plugin');

    expect(result).toBe(true);

    const detail = service.getPluginDetail('test-plugin');
    expect(detail!.status).toBe('uninstalled');
  });

  it('should return false when uninstalling non-installed plugin', () => {
    const service = new PluginConfigService(testDir);
    expect(service.uninstallPlugin('nonexistent')).toBe(false);
  });

  it('should parse plugin description from index.ts', () => {
    const service = new PluginConfigService(testDir);
    const detail = service.getPluginDetail('test-plugin');
    expect(detail!.description).toBe('A test plugin for unit testing');
  });

  it('should handle missing config.json gracefully', () => {
    mkdirSync(join(testDir, 'bare-plugin'), { recursive: true });
    writeFileSync(join(testDir, 'bare-plugin', 'index.ts'), `
export const barePlugin = { name: 'bare-plugin', version: '1.0.0' };
`);

    const service = new PluginConfigService(testDir);
    const detail = service.getPluginDetail('bare-plugin');

    expect(detail).not.toBeNull();
    expect(detail!.configSchema).toEqual({});
    expect(detail!.adminConfig).toEqual({ tabs: [] });
  });
});
