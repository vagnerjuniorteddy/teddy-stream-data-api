import { createWriteStream, ReadStream } from 'node:fs';
import { Duplex } from 'node:stream';

export type WriteStream = {
  stream: ReadStream;
  path: string;
  pipes: Array<Duplex>;
  onError?: (error: Error) => void;
};

export const createWritableStream = ({
  stream,
  path,
  pipes = [],
  onError,
}: WriteStream) => {
  let pipeIndex = 0;
  const recursive = (stream: ReadStream | Duplex, pipe: Duplex) => {
    pipeIndex++;

    const streamPiped = stream.pipe(pipe);

    if (pipes[pipeIndex]) {
      return recursive(streamPiped, pipes[pipeIndex]);
    }

    return streamPiped;
  };

  const streamPiped = recursive(stream, pipes[pipeIndex]);

  streamPiped.pipe(createWriteStream(path, { flags: 'w' }));

  if (onError) {
    stream.on('error', onError);
  }

  return streamPiped;
};
