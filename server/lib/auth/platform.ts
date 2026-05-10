import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { ChildProcess, SpawnOptions } from 'node:child_process';

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = !isWin && !isMac;

let wslCache: boolean | null = null;
const isWsl = (): boolean => {
  if (wslCache !== null) return wslCache;
  if (!isLinux) {
    wslCache = false;
    return false;
  }
  try {
    wslCache = readFileSync('/proc/version', 'utf-8')
      .toLowerCase()
      .includes('microsoft');
  } catch {
    wslCache = false;
  }
  return wslCache;
};

const resolveBin = (name: string): string => (isWin ? `${name}.cmd` : name);

const spawnBin = (
  name: string,
  args: string[],
  opts: SpawnOptions = {},
): ChildProcess => {
  if (isWin) {
    return spawn('cmd.exe', ['/d', '/s', '/c', `${name} ${args.join(' ')}`], {
      windowsHide: true,
      ...opts,
    });
  }
  return spawn(resolveBin(name), args, { windowsHide: true, ...opts });
};

export { isLinux, isMac, isWin, isWsl, resolveBin, spawnBin };
