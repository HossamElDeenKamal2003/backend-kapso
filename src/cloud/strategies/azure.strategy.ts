import { Injectable } from '@nestjs/common';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerClient,
} from '@azure/storage-blob';
import { CatchError } from 'decorators/CatchError.decorator';
import { CloudStrategy } from './cloud.interface';

@Injectable()
export class AzureStrategy implements CloudStrategy {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    const credentials = new StorageSharedKeyCredential(accountName, accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credentials,
    );
  }

  @CatchError()
  async generateSASToken({
    path,
    contentType,
  }: {
    path: string;
    contentType: string;
  }) {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const blobClient = containerClient.getBlobClient(path);

    const permissions = new BlobSASPermissions();
    permissions.write = true;
    permissions.create = true;

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName: path,
        permissions: permissions,
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
        startsOn: new Date(),
        contentType: contentType,
      },
      this.blobServiceClient.credential as StorageSharedKeyCredential,
    );

    return `${blobClient.url}?${sasToken}`;
  }

  @CatchError()
  async makePublic({ path }: { path: string }) {
    const blob = path
      .split('?')
      .at(0)
      .split(this.containerName + '/')
      .at(-1);
    const containerClient: ContainerClient =
      this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.setAccessPolicy('blob');
    const blobClient = containerClient.getBlobClient(blob);
    return `${blobClient.url}`;
  }

  @CatchError()
  async uploadFile({
    path,
    buffer,
    contentType,
  }: {
    path: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const blockBlobClient = containerClient.getBlockBlobClient(path);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    return blockBlobClient.url;
  }
}
