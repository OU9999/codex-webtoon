import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const findPackageRoot = (start: string): string => {
  let dir = start;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return start;
};

const rootFromMetaUrl = (metaUrl: string): string =>
  findPackageRoot(dirname(fileURLToPath(metaUrl)));

export { findPackageRoot, rootFromMetaUrl };
