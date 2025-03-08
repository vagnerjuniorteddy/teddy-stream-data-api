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
  const writableStream = createWriteStream(path, { flags: 'w' });

  pipes.forEach((pipe) => stream.pipe(pipe));

  stream.pipe(writableStream);

  if (onError) {
    stream.on('error', onError);
  }

  return writableStream;
};
