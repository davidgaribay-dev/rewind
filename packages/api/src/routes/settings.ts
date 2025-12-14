import { Hono } from 'hono';
import { getDb, schema } from '@/db/client';
import { eq } from 'drizzle-orm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { log } from '@/logger';
import os from 'os';

const app = new Hono();

// GET /settings/data-path - Get current data path
app.get('/data-path', async (c) => {
  try {
    const db = getDb();
    const setting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'rewind_data_path'),
    });

    return c.json({
      path: setting?.value || process.env.REWIND_DATA_PATH || '',
    });
  } catch (error) {
    log.error('Failed to get data path:', error);
    return c.json({ error: 'Failed to get data path' }, 500);
  }
});

// POST /settings/data-path - Set data path
app.post('/data-path', async (c) => {
  try {
    const { path: dataPath } = await c.req.json();

    if (!dataPath) {
      return c.json({ error: 'Path is required' }, 400);
    }

    const db = getDb();
    await db
      .insert(schema.settings)
      .values({
        key: 'rewind_data_path',
        value: dataPath,
      })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value: dataPath, updatedAt: new Date() },
      });

    log.info(`Data path updated to: ${dataPath}`);
    return c.json({ success: true, path: dataPath });
  } catch (error) {
    log.error('Failed to set data path:', error);
    return c.json({ error: 'Failed to set data path' }, 500);
  }
});

// GET /settings/browse?path=... - Browse directories
app.get('/browse', async (c) => {
  try {
    let browsePath = c.req.query('path') || os.homedir();

    // Expand ~ to home directory
    if (browsePath.startsWith('~')) {
      browsePath = path.join(os.homedir(), browsePath.slice(1));
    }

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(browsePath);

    // Check if directory exists
    try {
      const stats = await fs.stat(normalizedPath);
      if (!stats.isDirectory()) {
        return c.json({ error: 'Not a directory' }, 400);
      }
    } catch (error) {
      return c.json({ error: 'Directory does not exist' }, 404);
    }

    // Read directory contents
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });

    // Filter and format entries
    const directories = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(async (entry) => {
          const fullPath = path.join(normalizedPath, entry.name);
          let hasConversations = false;

          // Check if this directory contains .jsonl files
          try {
            const files = await fs.readdir(fullPath);
            hasConversations = files.some((file) => file.endsWith('.jsonl'));
          } catch {
            // Can't read directory
          }

          return {
            name: entry.name,
            path: fullPath,
            hasConversations,
          };
        })
    );

    // Get parent directory
    const parentPath = path.dirname(normalizedPath);

    return c.json({
      currentPath: normalizedPath,
      parentPath: normalizedPath !== '/' ? parentPath : null,
      directories: directories.sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (error) {
    log.error('Failed to browse directory:', error);
    return c.json({ error: 'Failed to browse directory' }, 500);
  }
});

// POST /settings/test-path - Test if path is valid
app.post('/test-path', async (c) => {
  try {
    const { path: testPath } = await c.req.json();

    if (!testPath) {
      return c.json({
        valid: false,
        message: 'Path is required',
      });
    }

    // Expand home directory
    const expandedPath = testPath.startsWith('~')
      ? path.join(os.homedir(), testPath.slice(1))
      : testPath;

    // Check if directory exists
    try {
      const stats = await fs.stat(expandedPath);
      if (!stats.isDirectory()) {
        return c.json({
          valid: false,
          message: 'Path is not a directory',
        });
      }
    } catch (error) {
      return c.json({
        valid: false,
        message: 'Directory does not exist',
      });
    }

    // Check if directory contains project folders
    try {
      const entries = await fs.readdir(expandedPath, { withFileTypes: true });
      const projectDirs = entries.filter((entry) => entry.isDirectory());

      // Check if at least one directory contains .jsonl files
      let conversationCount = 0;
      for (const dir of projectDirs) {
        const dirPath = path.join(expandedPath, dir.name);
        try {
          const files = await fs.readdir(dirPath);
          const jsonlFiles = files.filter((file) => file.endsWith('.jsonl'));
          conversationCount += jsonlFiles.length;
        } catch {
          // Skip directories we can't read
        }
      }

      if (conversationCount === 0) {
        return c.json({
          valid: false,
          message: 'No conversation files (.jsonl) found in project directories',
          projectCount: projectDirs.length,
        });
      }

      return c.json({
        valid: true,
        message: `Found ${projectDirs.length} projects with ${conversationCount} conversations`,
        projectCount: projectDirs.length,
        conversationCount,
      });
    } catch (error) {
      return c.json({
        valid: false,
        message: 'Failed to read directory contents',
      });
    }
  } catch (error) {
    log.error('Failed to test path:', error);
    return c.json({
      valid: false,
      message: 'Failed to test path',
    }, 500);
  }
});

export default app;
