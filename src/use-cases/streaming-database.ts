import { ObjectLiteral, Repository } from 'typeorm';
import { createReadableStream, createWritableStream } from '../functions';
import { Transform } from 'stream';
import { unlink } from 'fs/promises';

type ReturnHandle = Promise<void> | void;

type StreamingDatabaseType<Entity extends ObjectLiteral> = {
  entity: Repository<Entity>;
  query: {
    select: Array<keyof Entity>;
    where?: { sql: string; params: ObjectLiteral };
    limit?: number;
    offset?: number;
  };
  file: {
    path: string;
    formatLine: (line: Entity) => string;
    headers?: {
      addHeader: boolean;
      formatHeader: (headers: string[]) => string;
    };
    removeFileOnFinish: boolean;
  };
  handles: {
    onFinish: () => ReturnHandle;
    onClose: () => ReturnHandle;
    onError: (error: unknown) => ReturnHandle;
  };
};

export class StreamingDatabase {
  public static async process<Entity extends ObjectLiteral>({
    entity,
    query,
    file,
    handles: { onFinish, onClose, onError },
  }: StreamingDatabaseType<Entity>) {
    try {
      const streams = await createReadableStream({
        entity,
        select: query.select,
        limit: query.limit,
        offset: query.offset,
        where: query.where || { sql: '', params: {} },
      });

      const transformToString = new Transform({
        objectMode: true,
        transform(chunk: Entity, _encoding, callback) {
          callback(null, file.formatLine(chunk));
        },
      });

      const streamPiped = createWritableStream({
        stream: streams,
        path: file.path,
        pipes: [transformToString],
        headersConfig: file.headers?.addHeader
          ? {
              headers: query.select as string[],
              formatHeader: file.headers?.formatHeader,
            }
          : undefined,
      });

      streamPiped.on('finish', async () => {
        await onFinish();
        if (file.removeFileOnFinish) {
          await unlink(file.path);
        }
      });

      streamPiped.on('close', async () => {
        await onClose();
      });

      streamPiped.on('error', async (error) => {
        await onError(error);
      });

      streamPiped;
    } catch (error) {
      await onError(error);
      throw error;
    }
  }
}
