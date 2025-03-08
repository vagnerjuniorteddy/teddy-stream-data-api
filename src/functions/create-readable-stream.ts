import { ObjectLiteral, Repository } from 'typeorm';

export type CreateStream<T extends ObjectLiteral> = {
  entity: Repository<T>;
  select: Array<keyof T>;
  where: {
    sql: string;
    params: ObjectLiteral;
  };
  limit?: number;
  offset?: number;
};

export const createReadableStream = <T extends ObjectLiteral>({
  entity,
  select,
  where: { sql, params },
  limit,
  offset,
}: CreateStream<T>) => {
  const columns = (select?.length ? select : undefined) as string[];

  const query = entity
    .createQueryBuilder()
    .select(columns)
    .where(sql, params)
    .limit(limit)
    .offset(offset);

  return query.stream();
};
