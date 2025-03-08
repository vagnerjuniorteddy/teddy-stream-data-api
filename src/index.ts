import { createWriteStream, WriteStream } from 'fs';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { Transform, Writable } from 'stream';
import { pipeline } from 'stream/promises';

import {
  Column,
  CreateDateColumn,
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { createReadableStream, createWritableStream } from './functions';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}

export async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    username: 'postgres',
    password: 'admin',
    ssl: false,
    entities: [User],
    synchronize: true,
  });

  await dataSource.initialize();

  const userStreams = await createReadableStream({
    entity: dataSource.getRepository(User),
    select: ['id', 'name'],
    where: {
      sql: '',
      params: {},
    },
    limit: 1000,
    offset: 0,
  });

  const transform1 = new Transform({
    objectMode: true,
    transform(chunk: User, _encoding, callback) {
      const { id, name } = chunk;
      callback(null, { id, name });
    },
  });

  const transform2 = new Transform({
    objectMode: true,
    transform(chunk: { id: string; name: string }, _encoding, callback) {
      callback(null, `${chunk.id}, ${chunk.name}\n`);
    },
  });

  createWritableStream({
    stream: userStreams,
    path: resolve('users.csv'),
    pipes: [transform1, transform2],
    onError: (error) => {
      console.error(`Error writing to file: ${error.message}`);
    },
  });
}

main();
