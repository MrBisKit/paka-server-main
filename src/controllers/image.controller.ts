import type { Request, Response } from 'express';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const uploadImageToAzure = async (req: Request): Promise<string | null> => {
  const file = req.file;

  if (!file) return null;

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING || ''
  );
  const containerClient = blobServiceClient.getContainerClient('delivery-images');
  await containerClient.createIfNotExists({ access: 'container' });

  const blobName = `${uuidv4()}${path.extname(file.originalname)}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
    },
  });

  return blockBlobClient.url;
};
