import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { UploadedFile, AuthRequest, Reaction } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const uploadFile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : []);
  const { description, tags, isPublic = true } = req.body;

  if (files.length === 0) {
    res.status(400).json({
      success: false,
      error: 'No files uploaded',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      const uploadedFile: UploadedFile = {
        id: uuidv4(),
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        userId: req.user?.id || 'anonymous',
        description,
        tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
        isPublic,
        uploadedAt: new Date().toISOString(),
        downloadCount: 0
      };

      await db.insert('uploadedFiles', uploadedFile);
      uploadedFiles.push(uploadedFile);
    }

    res.json({
      success: true,
      data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file(s)',
      timestamp: new Date().toISOString()
    });
  }
});

export const getFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { fileId } = req.params;

  const file = await db.findOne('uploadedFiles', (f: UploadedFile) => f.id === fileId);

  if (!file) {
    res.status(404).json({
      success: false,
      error: 'File not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Check if file is public or user owns it
  const userId = (req as AuthRequest).user?.id;
  if (!file.isPublic && file.userId !== userId) {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // Increment download count
    await db.update('uploadedFiles',
      (f: UploadedFile) => f.id === fileId,
      (f: UploadedFile) => ({ ...f, downloadCount: f.downloadCount + 1 })
    );

    // Send file
    const fileBuffer = await fs.readFile(file.path);
    
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.size.toString());
    res.send(fileBuffer);
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve file',
      timestamp: new Date().toISOString()
    });
  }
});

export const deleteFile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { fileId } = req.params;
  const userId = req.user?.id || 'anonymous';

  const file = await db.findOne('uploadedFiles', (f: UploadedFile) => 
    f.id === fileId && f.userId === userId
  );

  if (!file) {
    res.status(404).json({
      success: false,
      error: 'File not found or not authorized',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // Delete physical file
    await fs.unlink(file.path);

    // Delete from database
    await db.delete('uploadedFiles', (f: UploadedFile) => f.id === fileId);

    res.json({
      success: true,
      message: 'File deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      timestamp: new Date().toISOString()
    });
  }
});

export const getUserFiles = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'anonymous';
  const { limit, offset, type } = req.query;

  let files = await db.findMany('uploadedFiles', (f: UploadedFile) => 
    f.userId === userId
  );

  // Filter by file type
  if (type && typeof type === 'string') {
    files = files.filter((f: UploadedFile) => f.mimetype.startsWith(type));
  }

  // Sort by upload date
  files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  // Pagination
  const limitNum = limit ? parseInt(limit as string) : 20;
  const offsetNum = offset ? parseInt(offset as string) : 0;
  const paginatedFiles = files.slice(offsetNum, offsetNum + limitNum);

  // Remove file paths from response for security
  const safeFiles = paginatedFiles.map(file => ({
    ...file,
    path: undefined,
    url: `/api/upload/file/${file.id}`
  }));

  res.json({
    success: true,
    data: safeFiles,
    total: files.length,
    limit: limitNum,
    offset: offsetNum,
    timestamp: new Date().toISOString()
  });
});

export const exportReaction = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { reactionId } = req.params;
  const { format = 'json' } = req.query;

  const reaction = await db.findOne('reactions', (r: Reaction) => r.id === reactionId);

  if (!reaction) {
    res.status(404).json({
      success: false,
      error: 'Reaction not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    let exportData: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(reaction, null, 2);
        contentType = 'application/json';
        filename = `reaction-${reactionId}.json`;
        break;
      
      case 'csv':
        exportData = convertReactionToCSV(reaction);
        contentType = 'text/csv';
        filename = `reaction-${reactionId}.csv`;
        break;
      
      case 'xml':
        exportData = convertReactionToXML(reaction);
        contentType = 'application/xml';
        filename = `reaction-${reactionId}.xml`;
        break;
      
      default:
        res.status(400).json({
          success: false,
          error: 'Unsupported export format',
          timestamp: new Date().toISOString()
        });
        return;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export reaction',
      timestamp: new Date().toISOString()
    });
  }
});

export const importReaction = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const fileContent = await fs.readFile(file.path, 'utf-8');
    let reactionData: any;

    // Parse based on file type
    if (file.mimetype === 'application/json') {
      reactionData = JSON.parse(fileContent);
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported file format for import',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate reaction data
    if (!reactionData.name || !reactionData.equation || !reactionData.reactants || !reactionData.products) {
      res.status(400).json({
        success: false,
        error: 'Invalid reaction data format',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Create new reaction with imported data
    const newReaction: Reaction = {
      ...reactionData,
      id: uuidv4(),
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
      isPublic: false // Imported reactions are private by default
    };

    await db.insert('reactions', newReaction);

    // Clean up uploaded file
    await fs.unlink(file.path);

    res.json({
      success: true,
      data: newReaction,
      message: 'Reaction imported successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up uploaded file on error
    try {
      await fs.unlink(file.path);
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to import reaction',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions
function convertReactionToCSV(reaction: Reaction): string {
  const headers = ['Field', 'Value'];
  const rows = [
    ['ID', reaction.id],
    ['Name', reaction.name],
    ['Equation', reaction.equation],
    ['Reactants', reaction.reactants.join('; ')],
    ['Products', reaction.products.join('; ')],
    ['Type', reaction.reactionType],
    ['Energy Change (kJ/mol)', reaction.energyChange?.toString() || ''],
    ['Temperature (K)', reaction.temperature?.toString() || ''],
    ['Pressure (atm)', reaction.pressure?.toString() || ''],
    ['Catalyst', reaction.catalyst || ''],
    ['Description', reaction.description || ''],
    ['Yield (%)', reaction.yieldPercentage?.toString() || ''],
    ['Created At', reaction.createdAt],
    ['Tags', reaction.tags?.join('; ') || '']
  ];

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function convertReactionToXML(reaction: Reaction): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<reaction>
  <id>${reaction.id}</id>
  <name><![CDATA[${reaction.name}]]></name>
  <equation><![CDATA[${reaction.equation}]]></equation>
  <reactants>
    ${reaction.reactants.map(r => `<reactant><![CDATA[${r}]]></reactant>`).join('\n    ')}
  </reactants>
  <products>
    ${reaction.products.map(p => `<product><![CDATA[${p}]]></product>`).join('\n    ')}
  </products>
  <type>${reaction.reactionType}</type>
  <energyChange>${reaction.energyChange || ''}</energyChange>
  <temperature>${reaction.temperature || ''}</temperature>
  <pressure>${reaction.pressure || ''}</pressure>
  <catalyst><![CDATA[${reaction.catalyst || ''}]]></catalyst>
  <description><![CDATA[${reaction.description || ''}]]></description>
  <yieldPercentage>${reaction.yieldPercentage || ''}</yieldPercentage>
  <createdAt>${reaction.createdAt}</createdAt>
  <tags>
    ${reaction.tags?.map(t => `<tag><![CDATA[${t}]]></tag>`).join('\n    ') || ''}
  </tags>
</reaction>`;
}