import { resolve } from 'path';
import { Transform } from 'stream';

import {
  Column,
  CreateDateColumn,
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { createWritableStream } from './functions/create-writable-stream';
import { createReadableStream } from './functions/create-readable-stream';

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

  const streams = await createReadableStream({
    entity: dataSource.getRepository(User),
    select: ['id', 'name'],
    where: { sql: '', params: {} },
  });

  const writeStream = createWritableStream({
    stream: streams,
    path: resolve(__dirname, 'users.txt'),
    pipes: [
      new Transform({
        objectMode: true,
        transform(chunk, _encoding, callback) {
          const { id, name } = chunk;
          callback(null, `${id},${name}\n`);
        },
      }),
    ],
    onError: (error) => console.error('Error:', error),
  });

  writeStream.on('error', (error) => console.error('Error:', error));
}

main();
