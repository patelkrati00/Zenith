import { Router } from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';
import { constants } from 'fs';
 import { execSync } from 'child_process';

/**
 * Create project/workspace management routes
 */
export function createProjectRouter(config) {
    const router = Router();

    // Configure multer for file uploads
    const storage = multer.diskStorage({
        destination: async (req, file, cb) => {
            const workspaceId = req.workspaceId || nanoid(10);
            const workspacePath = path.join(config.workspaceBase, workspaceId);
            
            try {
                await fs.mkdir(workspacePath, { recursive: true });
                req.workspaceId = workspaceId;
                req.workspacePath = workspacePath;
                cb(null, workspacePath);
            } catch (error) {
                cb(error);
            }
        },
        filename: (req, file, cb) => {
            // Preserve original filename
            cb(null, file.originalname);
        }
    });

    const upload = multer({
        storage,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB max per file
            files: 50 // Max 50 files
        },
        fileFilter: (req, file, cb) => {
            // Block potentially dangerous extensions
            const blocked = ['.exe', '.dll', '.so', '.dylib', '.bat', '.sh', '.cmd'];
            const ext = path.extname(file.originalname).toLowerCase();
            
            if (blocked.includes(ext)) {
                cb(new Error(`File type ${ext} not allowed`));
            } else {
                cb(null, true);
            }
        }
    });

    /**
     * POST /projects/upload
     * Upload multiple files or a zip archive
     */
  

router.post('/upload', upload.any(), async (req, res) => {
  try {
    const { workspaceId, workspacePath } = req;
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    await fs.mkdir(workspacePath, { recursive: true });

    for (const file of files) {
      const filePath = file.path;
      const destPath = path.join(workspacePath, file.originalname);

      if (file.originalname.endsWith('.zip')) {
        const zip = new AdmZip(filePath);
        zip.extractAllTo(workspacePath, true);
        await fs.unlink(filePath);
        console.log(`📦 Extracted ZIP to workspace ${workspaceId}`);
      } 
      else if (file.originalname.endsWith('.tar.gz') || file.originalname.endsWith('.tgz')) {
        execSync(`tar -xzf "${filePath}" -C "${workspacePath}"`);
        await fs.unlink(filePath);
        console.log(`📦 Extracted TAR.GZ to workspace ${workspaceId}`);
      } 
      else {
        // ✅ Handle normal files like .py, .whl, etc.
        await fs.rename(filePath, destPath);
        console.log(`📄 Saved file: ${file.originalname}`);
      }
    }

    res.json({ workspaceId });
  } catch (error) {
    console.error('❌ Upload handler error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});



    /**
     * POST /projects/create
     * Create an empty workspace
     */
    router.post('/create', async (req, res) => {
        try {
            const workspaceId = nanoid(10);
            const workspacePath = path.join(config.workspaceBase, workspaceId);

            await fs.mkdir(workspacePath, { recursive: true });

            console.log(`📁 Created empty workspace ${workspaceId}`);

            res.json({
                workspaceId,
                workspacePath: workspacePath,
                message: 'Workspace created successfully'
            });
        } catch (error) {
            console.error('Create workspace error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /projects/:workspaceId/files
     * List all files in a workspace
     */
    router.get('/:workspaceId/files', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const workspacePath = path.join(config.workspaceBase, workspaceId);

            // Check if workspace exists
            try {
                await fs.access(workspacePath, constants.F_OK);
            } catch {
                return res.status(404).json({ error: 'Workspace not found' });
            }

            const fileList = await getFileTree(workspacePath, workspacePath);

            res.json({
                workspaceId,
                fileCount: fileList.length,
                files: fileList
            });
        } catch (error) {
            console.error('List files error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /projects/:workspaceId/file/*
     * Read a specific file from workspace
     */
    router.get('/:workspaceId/file/*', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const filePath = req.params[0]; // Everything after /file/
            const workspacePath = path.join(config.workspaceBase, workspaceId);
            const fullPath = path.join(workspacePath, filePath);

            // Security: ensure file is within workspace
            const resolvedPath = path.resolve(fullPath);
            const resolvedWorkspace = path.resolve(workspacePath);
            
            if (!resolvedPath.startsWith(resolvedWorkspace)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            try {
                const content = await fs.readFile(fullPath, 'utf8');
                res.json({
                    path: filePath,
                    content
                });
            } catch {
                res.status(404).json({ error: 'File not found' });
            }
        } catch (error) {
            console.error('Read file error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * PUT /projects/:workspaceId/file/*
     * Write/update a file in workspace
     */
    router.put('/:workspaceId/file/*', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const filePath = req.params[0];
            const { content } = req.body;

            if (content === undefined) {
                return res.status(400).json({ error: 'Missing content field' });
            }

            const workspacePath = path.join(config.workspaceBase, workspaceId);
            const fullPath = path.join(workspacePath, filePath);

            // Security: ensure file is within workspace
            const resolvedPath = path.resolve(fullPath);
            const resolvedWorkspace = path.resolve(workspacePath);
            
            if (!resolvedPath.startsWith(resolvedWorkspace)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Create parent directories if needed
            await fs.mkdir(path.dirname(fullPath), { recursive: true });

            // Write file
            await fs.writeFile(fullPath, content, 'utf8');

            console.log(`📝 Updated file: ${workspaceId}/${filePath}`);

            res.json({
                workspaceId,
                path: filePath,
                message: 'File saved successfully'
            });
        } catch (error) {
            console.error('Write file error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * DELETE /projects/:workspaceId
     * Delete a workspace and all its files
     */
    router.delete('/:workspaceId', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const workspacePath = path.join(config.workspaceBase, workspaceId);

            await fs.rm(workspacePath, { recursive: true, force: true });

            console.log(`🗑️ Deleted workspace ${workspaceId}`);

            res.json({
                workspaceId,
                message: 'Workspace deleted successfully'
            });
        } catch (error) {
            console.error('Delete workspace error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

/**
 * Recursively get all files in a directory
 */
async function getFileTree(dirPath, basePath) {
    const files = [];
    
    async function scan(currentPath) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            const relativePath = path.relative(basePath, fullPath);
            
            if (entry.isDirectory()) {
                await scan(fullPath);
            } else {
                const stats = await fs.stat(fullPath);
                files.push({
                    path: relativePath.split(path.sep).join('/'), // Use forward slashes
                    name: entry.name,
                    size: stats.size,
                    modified: stats.mtime
                });
            }
        }
    }
    
    await scan(dirPath);
    return files;
}
