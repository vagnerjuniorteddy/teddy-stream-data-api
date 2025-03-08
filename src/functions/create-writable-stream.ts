import { createWriteStream, ReadStream } from 'node:fs';
import { Duplex } from 'node:stream';

export type WriteStream = {
  stream: ReadStream;
  path: string;
  pipes: Array<Duplex>;
  headersConfig?: {
    headers: string[];
    formatHeader: (headers: string[]) => string;
  };
};

export const createWritableStream = ({
  stream,
  path,
  pipes = [],
  headersConfig,
}: WriteStream) => {
  const addPipes = ({
    stream,
    pipes,
  }: {
    stream: ReadStream;
    pipes: Duplex[];
  }) => {
    let pipeIndex = 0;
    const recursive = (stream: ReadStream | Duplex, pipe: Duplex) => {
      pipeIndex++;

      const streamPiped = stream.pipe(pipe);

      if (pipes[pipeIndex]) {
        return recursive(streamPiped, pipes[pipeIndex]);
      }

      return streamPiped;
    };

    return recursive(stream, pipes[pipeIndex]);
  };

  const createHeaders = ({
    path,
    headersConfig,
  }: {
    path: string;
    headersConfig?: {
      headers: string[];
      formatHeader: (headers: string[]) => string;
    };
  }) => {
    if (headersConfig) {
      const { headers, formatHeader } = headersConfig;
      const writeStreamHeader = createWriteStream(path, {
        flags: 'w',
      });
      writeStreamHeader.write(`${formatHeader(headers)}\n`);
    }
  };

  createHeaders({ path, headersConfig });

  const streamPiped = addPipes({ stream, pipes });

  const writeStream = createWriteStream(path, {
    flags: !!headersConfig ? 'a' : 'w',
  });

  streamPiped.pipe(writeStream);

  return streamPiped;
};
