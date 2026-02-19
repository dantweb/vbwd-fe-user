import { Router } from 'express';
import type { Request, Response } from 'express';
import { PluginConfigService } from '../services/plugin-config.js';

export function createPluginRoutes(service: PluginConfigService): Router {
  const router = Router();

  // GET /_plugins — List all plugins
  router.get('/', (_req: Request, res: Response) => {
    const plugins = service.listPlugins();
    res.json(plugins);
  });

  // GET /_plugins/:name — Plugin detail
  router.get('/:name', (req: Request, res: Response) => {
    const name = req.params.name as string;
    const detail = service.getPluginDetail(name);
    if (!detail) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    res.json(detail);
  });

  // PUT /_plugins/:name/config — Save config
  router.put('/:name/config', (req: Request, res: Response) => {
    const name = req.params.name as string;
    const success = service.savePluginConfig(name, req.body);
    if (!success) {
      res.status(404).json({ error: 'Plugin not found' });
      return;
    }
    res.json({ message: 'Configuration saved' });
  });

  // POST /_plugins/:name/enable
  router.post('/:name/enable', (req: Request, res: Response) => {
    const name = req.params.name as string;
    const success = service.enablePlugin(name);
    if (!success) {
      res.status(404).json({ error: 'Plugin not found or not installed' });
      return;
    }
    res.json({ message: 'Plugin enabled' });
  });

  // POST /_plugins/:name/disable
  router.post('/:name/disable', (req: Request, res: Response) => {
    const name = req.params.name as string;
    const success = service.disablePlugin(name);
    if (!success) {
      res.status(404).json({ error: 'Plugin not found or not installed' });
      return;
    }
    res.json({ message: 'Plugin disabled' });
  });

  // POST /_plugins/:name/install
  router.post('/:name/install', (req: Request, res: Response) => {
    const name = req.params.name as string;
    const success = service.installPlugin(name);
    if (!success) {
      res.status(400).json({ error: 'Plugin not found or already installed' });
      return;
    }
    res.json({ message: 'Plugin installed' });
  });

  // POST /_plugins/:name/uninstall
  router.post('/:name/uninstall', (req: Request, res: Response) => {
    const name = req.params.name as string;
    const success = service.uninstallPlugin(name);
    if (!success) {
      res.status(404).json({ error: 'Plugin not found or not installed' });
      return;
    }
    res.json({ message: 'Plugin uninstalled' });
  });

  return router;
}
