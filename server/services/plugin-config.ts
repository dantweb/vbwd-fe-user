import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, renameSync } from 'fs';
import { join, resolve } from 'path';
import type {
  PluginRegistry,
  PluginConfigField,
  AdminConfig,
  UserPluginEntry,
  UserPluginDetail
} from '../types.js';

export class PluginConfigService {
  private pluginsDir: string;
  private registryPath: string;
  private configPath: string;

  constructor(pluginsDir: string) {
    this.pluginsDir = resolve(pluginsDir);
    this.registryPath = join(this.pluginsDir, 'plugins.json');
    this.configPath = join(this.pluginsDir, 'config.json');
  }

  private readJSON<T>(filePath: string): T | null {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  }

  private writeJSON(filePath: string, data: unknown): void {
    const dir = join(filePath, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmpPath = filePath + '.tmp';
    writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    renameSync(tmpPath, filePath);
  }

  private getRegistry(): PluginRegistry {
    const data = this.readJSON<PluginRegistry>(this.registryPath);
    return data || { plugins: {} };
  }

  private getSavedConfig(): Record<string, Record<string, unknown>> {
    const data = this.readJSON<Record<string, Record<string, unknown>>>(this.configPath);
    return data || {};
  }

  private getPluginDirs(): string[] {
    if (!existsSync(this.pluginsDir)) return [];
    return readdirSync(this.pluginsDir).filter(name => {
      const dir = join(this.pluginsDir, name);
      return statSync(dir).isDirectory() && existsSync(join(dir, 'index.ts'));
    });
  }

  private getPluginDescription(pluginName: string): string {
    const indexPath = join(this.pluginsDir, pluginName, 'index.ts');
    if (!existsSync(indexPath)) return '';
    const content = readFileSync(indexPath, 'utf-8');
    const match = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
    return match ? match[1] : '';
  }

  private getPluginVersion(pluginName: string): string {
    const indexPath = join(this.pluginsDir, pluginName, 'index.ts');
    if (!existsSync(indexPath)) return '0.0.0';
    const content = readFileSync(indexPath, 'utf-8');
    const match = content.match(/version:\s*['"`]([^'"`]+)['"`]/);
    return match ? match[1] : '0.0.0';
  }

  listPlugins(): UserPluginEntry[] {
    const registry = this.getRegistry();
    const pluginDirs = this.getPluginDirs();

    return pluginDirs.map(name => {
      const entry = registry.plugins[name];
      const hasConfig = existsSync(join(this.pluginsDir, name, 'config.json'));

      let status: 'active' | 'inactive' | 'uninstalled' = 'uninstalled';
      if (entry) {
        status = entry.enabled ? 'active' : 'inactive';
      }

      return {
        name,
        version: entry?.version || this.getPluginVersion(name),
        description: this.getPluginDescription(name),
        status,
        hasConfig
      };
    });
  }

  getPluginDetail(name: string): UserPluginDetail | null {
    const pluginDir = join(this.pluginsDir, name);
    if (!existsSync(pluginDir) || !existsSync(join(pluginDir, 'index.ts'))) {
      return null;
    }

    const registry = this.getRegistry();
    const entry = registry.plugins[name];
    const savedConfig = this.getSavedConfig();

    const configSchema = this.readJSON<Record<string, PluginConfigField>>(
      join(pluginDir, 'config.json')
    ) || {};

    const adminConfig = this.readJSON<AdminConfig>(
      join(pluginDir, 'admin-config.json')
    ) || { tabs: [] };

    let status: 'active' | 'inactive' | 'uninstalled' = 'uninstalled';
    if (entry) {
      status = entry.enabled ? 'active' : 'inactive';
    }

    return {
      name,
      version: entry?.version || this.getPluginVersion(name),
      description: this.getPluginDescription(name),
      author: '',
      status,
      dependencies: [],
      configSchema,
      adminConfig,
      savedConfig: savedConfig[name] || {}
    };
  }

  savePluginConfig(name: string, config: Record<string, unknown>): boolean {
    const pluginDir = join(this.pluginsDir, name);
    if (!existsSync(pluginDir)) return false;

    const allConfig = this.getSavedConfig();
    allConfig[name] = config;
    this.writeJSON(this.configPath, allConfig);
    return true;
  }

  enablePlugin(name: string): boolean {
    const registry = this.getRegistry();
    if (!registry.plugins[name]) return false;

    registry.plugins[name].enabled = true;
    this.writeJSON(this.registryPath, registry);
    return true;
  }

  disablePlugin(name: string): boolean {
    const registry = this.getRegistry();
    if (!registry.plugins[name]) return false;

    registry.plugins[name].enabled = false;
    this.writeJSON(this.registryPath, registry);
    return true;
  }

  installPlugin(name: string): boolean {
    const pluginDir = join(this.pluginsDir, name);
    if (!existsSync(pluginDir) || !existsSync(join(pluginDir, 'index.ts'))) {
      return false;
    }

    const registry = this.getRegistry();
    if (registry.plugins[name]) return false;

    registry.plugins[name] = {
      enabled: false,
      version: this.getPluginVersion(name),
      installedAt: new Date().toISOString(),
      source: 'local'
    };
    this.writeJSON(this.registryPath, registry);

    const config = this.getSavedConfig();
    if (!config[name]) {
      config[name] = {};
      this.writeJSON(this.configPath, config);
    }

    return true;
  }

  uninstallPlugin(name: string): boolean {
    const registry = this.getRegistry();
    if (!registry.plugins[name]) return false;

    delete registry.plugins[name];
    this.writeJSON(this.registryPath, registry);
    return true;
  }
}
