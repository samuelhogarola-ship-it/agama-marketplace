import { readFile } from 'node:fs/promises';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import type { PostalZone } from './company-address';

const unzip = promisify(gunzip);
let catalog: Promise<Record<string, PostalZone[]>> | undefined;
export async function lookupPostalCode(code: string): Promise<PostalZone[] | null> {
  if (!/^[0-9]{5}$/.test(code)) return null;
  catalog ??= readFile(path.join(process.cwd(), 'src/data/mx-postal.json.gz'))
    .then(unzip).then(buffer => JSON.parse(buffer.toString('utf8')) as Record<string, PostalZone[]>)
    .catch(error => { catalog = undefined; throw error; });
  return (await catalog)[code] ?? null;
}
