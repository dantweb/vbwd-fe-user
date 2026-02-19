export interface PluginRegistryEntry {
  enabled: boolean;
  version: string;
  installedAt: string;
  source: string;
}

export interface PluginRegistry {
  plugins: Record<string, PluginRegistryEntry>;
}

export interface PluginConfigField {
  type: 'string' | 'number' | 'boolean' | 'select';
  default: unknown;
  description: string;
}

export interface AdminConfigField {
  key: string;
  label: string;
  component: 'input' | 'checkbox' | 'select' | 'textarea';
  inputType?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

export interface AdminConfigTab {
  id: string;
  label: string;
  fields: AdminConfigField[];
}

export interface AdminConfig {
  tabs: AdminConfigTab[];
}

export interface UserPluginEntry {
  name: string;
  version: string;
  description: string;
  status: 'active' | 'inactive' | 'uninstalled';
  hasConfig: boolean;
}

export interface UserPluginDetail {
  name: string;
  version: string;
  description: string;
  author: string;
  status: 'active' | 'inactive' | 'uninstalled';
  dependencies: string[];
  configSchema: Record<string, PluginConfigField>;
  adminConfig: AdminConfig;
  savedConfig: Record<string, unknown>;
}
