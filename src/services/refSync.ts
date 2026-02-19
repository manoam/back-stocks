import prisma from '../config/database';
import rabbitmq from './rabbitmq';

const APP_NAME = process.env.APP_NAME || 'stock';

interface RefTable {
  refTable: string;
  baseName: string;
  columns: string[];
}

async function discoverRefTables(): Promise<RefTable[]> {
  const tablesResult = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE '%_ref'
    ORDER BY table_name
  `;

  const refTables: RefTable[] = [];

  for (const row of tablesResult) {
    const refTable = row.table_name;
    const baseName = refTable.replace(/_ref$/, '');
    const columns = await getTableColumns(refTable);
    refTables.push({ refTable, baseName, columns });
  }

  return refTables;
}

async function getTableColumns(tableName: string): Promise<string[]> {
  const result = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;
  return result.map((r) => r.column_name);
}

function extractEventData(event: any): Record<string, any> | null {
  // Format standard : { id, table, action, data, timestamp, actor }
  if (event.table && event.action && event.data) {
    return event.data;
  }
  // Format legacy : { id, timestamp, source, type, data }
  if (event.source && event.type && event.data) {
    if (event.data?.data?.current) return event.data.data.current;
    if (event.data?.current) return event.data.current;
    return event.data;
  }
  return event;
}

function extractAction(event: any, routingKey: string): string {
  if (event.action) return event.action;
  const parts = routingKey.split('.');
  return parts[parts.length - 1];
}

async function handleRefEvent(
  refTable: string,
  columns: string[],
  event: any,
  routingKey: string
): Promise<void> {
  const data = extractEventData(event);
  const action = extractAction(event, routingKey);

  if (!data || (!data.id && !['deleted', 'archived', 'removed'].includes(action))) {
    return;
  }

  // DELETE / ARCHIVE
  if (['deleted', 'archived', 'removed'].includes(action)) {
    const id = data.id || event.id;
    if (!id) return;
    await prisma.$executeRawUnsafe(`DELETE FROM "${refTable}" WHERE id = $1`, id);
    console.log(`[RefSync] Deleted id=${id} from ${refTable}`);
    return;
  }

  // UPSERT (inserted / updated / created / modified)
  const columnsSet = new Set(columns);
  const presentColumns: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (columnsSet.has(key)) {
      presentColumns.push(key);
      values.push(val);
    }
  }

  if (presentColumns.length === 0 || !presentColumns.includes('id')) return;

  const updateColumns = presentColumns.filter((col) => col !== 'id');
  if (updateColumns.length === 0) return;

  const placeholders = presentColumns.map((_, i) => `$${i + 1}`).join(', ');
  const updateClause = updateColumns
    .map((col) => `"${col}" = EXCLUDED."${col}"`)
    .join(', ');

  const query = `
    INSERT INTO "${refTable}" (${presentColumns.map((c) => `"${c}"`).join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (id) DO UPDATE SET ${updateClause}
  `;

  await prisma.$executeRawUnsafe(query, ...values);
  console.log(`[RefSync] Upserted id=${data.id} into ${refTable} (${presentColumns.length} cols)`);
}

export async function startRefSync(): Promise<void> {
  const refTables = await discoverRefTables();

  if (refTables.length === 0) {
    console.log('[RefSync] No _ref tables found');
    return;
  }

  console.log(`[RefSync] Found ${refTables.length} _ref tables`);

  for (const { refTable, baseName, columns } of refTables) {
    const pattern = `*.${baseName}.*`;
    const queueName = `${APP_NAME}.ref_sync.${baseName}`;

    await rabbitmq.subscribe(
      pattern,
      async (event: any, routingKey: string) => {
        try {
          await handleRefEvent(refTable, columns, event, routingKey);
        } catch (error: any) {
          console.error(`[RefSync] Error syncing ${refTable}:`, error.message);
        }
      },
      queueName
    );

    console.log(`[RefSync] ${refTable} <- ${pattern}`);
  }

  console.log(`[RefSync] All ${refTables.length} subscriptions active`);
}
