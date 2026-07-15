import { describe, expect, it, vi } from 'vitest';
import {
  alreadyHighPerformance,
  buildRegQueryArgs,
  buildRegWriteArgs,
  forceHighPerformanceGpu,
  HIGH_PERF_GPU_SWITCHES,
  HIGH_PERFORMANCE_PREFERENCE,
  USER_GPU_PREFERENCES_KEY,
} from '../electron/gpu_preference.cjs';

const EXE =
  'C:\\Users\\p\\AppData\\Local\\Programs\\world-of-claudecraft\\World of ClaudeCraft.exe';

function fakeApp() {
  const switches: string[] = [];
  return {
    switches,
    app: {
      commandLine: { appendSwitch: (name: string) => switches.push(name) },
      getPath: (name: string) => (name === 'exe' ? EXE : ''),
    },
  };
}

describe('GPU preference constants (load-bearing literals)', () => {
  it('appends BOTH the hyphen and underscore switch spellings', () => {
    // The hyphen form is the real Chromium 150 switch name; the underscore form is what
    // Electron's docs list. Chromium matches switch names exactly, so both must ship.
    expect(HIGH_PERF_GPU_SWITCHES).toEqual([
      'force-high-performance-gpu',
      'force_high_performance_gpu',
    ]);
  });

  it('targets the Windows per-app graphics-preference key with the high-performance value', () => {
    expect(USER_GPU_PREFERENCES_KEY).toBe('HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences');
    // 2 = high performance (discrete); 1 = power saving (integrated); 0 = let Windows decide.
    expect(HIGH_PERFORMANCE_PREFERENCE).toBe('GpuPreference=2;');
  });
});

describe('buildRegQueryArgs / buildRegWriteArgs', () => {
  it('queries this exe path under the preferences key', () => {
    expect(buildRegQueryArgs(EXE)).toEqual(['query', USER_GPU_PREFERENCES_KEY, '/v', EXE]);
  });

  it('writes GpuPreference=2 as a REG_SZ keyed by the exe path, forced', () => {
    expect(buildRegWriteArgs(EXE)).toEqual([
      'add',
      USER_GPU_PREFERENCES_KEY,
      '/v',
      EXE,
      '/t',
      'REG_SZ',
      '/d',
      'GpuPreference=2;',
      '/f',
    ]);
  });
});

describe('alreadyHighPerformance', () => {
  it('is true only when the stored value is exactly high performance (2)', () => {
    expect(
      alreadyHighPerformance(
        `\r\nHKEY_CURRENT_USER\\Software\\Microsoft\\DirectX\\UserGpuPreferences\r\n    ${EXE}    REG_SZ    GpuPreference=2;\r\n`,
      ),
    ).toBe(true);
    expect(alreadyHighPerformance('    REG_SZ    GpuPreference=1;')).toBe(false); // power saving
    expect(alreadyHighPerformance('    REG_SZ    GpuPreference=0;')).toBe(false); // let Windows decide
    expect(alreadyHighPerformance('GpuPreference=20;')).toBe(false); // not a real value; lookahead guard
    expect(alreadyHighPerformance('')).toBe(false);
    expect(alreadyHighPerformance(undefined)).toBe(false);
    expect(alreadyHighPerformance(null)).toBe(false);
  });
});

describe('forceHighPerformanceGpu', () => {
  it('appends both switches on non-Windows and never touches the registry', () => {
    const { app, switches } = fakeApp();
    const execFileSync = vi.fn();
    forceHighPerformanceGpu({ app, platform: 'darwin', execFileSync });
    expect(switches).toEqual(['force-high-performance-gpu', 'force_high_performance_gpu']);
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('writes the high-performance preference on Windows when no value is stored yet', () => {
    const { app, switches } = fakeApp();
    // reg query throws (value/key absent) -> reg add runs.
    const execFileSync = vi.fn((_cmd: string, args: string[]) => {
      if (args[0] === 'query')
        throw new Error('ERROR: unable to find the specified registry value');
      return '';
    });
    forceHighPerformanceGpu({ app, platform: 'win32', execFileSync, regExe: 'reg.exe' });
    expect(switches).toContain('force-high-performance-gpu');
    const writeCall = execFileSync.mock.calls.find((c) => c[1][0] === 'add');
    expect(writeCall).toBeTruthy();
    expect(writeCall?.[1]).toEqual(buildRegWriteArgs(EXE));
  });

  it('does NOT rewrite when the preference is already high performance', () => {
    const { app } = fakeApp();
    const execFileSync = vi.fn((_cmd: string, args: string[]) => {
      if (args[0] === 'query') return `    ${EXE}    REG_SZ    GpuPreference=2;`;
      return '';
    });
    forceHighPerformanceGpu({ app, platform: 'win32', execFileSync, regExe: 'reg.exe' });
    expect(execFileSync.mock.calls.some((c) => c[1][0] === 'add')).toBe(false);
  });

  it('overwrites an existing power-saving (integrated) preference with high performance', () => {
    const { app } = fakeApp();
    const execFileSync = vi.fn((_cmd: string, args: string[]) => {
      if (args[0] === 'query') return `    ${EXE}    REG_SZ    GpuPreference=1;`;
      return '';
    });
    forceHighPerformanceGpu({ app, platform: 'win32', execFileSync, regExe: 'reg.exe' });
    expect(execFileSync.mock.calls.some((c) => c[1][0] === 'add')).toBe(true);
  });

  it('never throws if the registry write fails, so the app still boots', () => {
    const { app } = fakeApp();
    const execFileSync = vi.fn(() => {
      throw new Error('reg unavailable');
    });
    expect(() =>
      forceHighPerformanceGpu({ app, platform: 'win32', execFileSync, regExe: 'reg.exe' }),
    ).not.toThrow();
  });

  it('resolves reg.exe under System32 from SystemRoot by default', () => {
    const { app } = fakeApp();
    const calls: string[] = [];
    const execFileSync = vi.fn((cmd: string, args: string[]) => {
      calls.push(cmd);
      if (args[0] === 'query') throw new Error('missing');
      return '';
    });
    forceHighPerformanceGpu({
      app,
      platform: 'win32',
      execFileSync,
      env: { SystemRoot: 'D:\\Windows' },
    });
    expect(calls.every((c) => c === 'D:\\Windows\\System32\\reg.exe')).toBe(true);
  });
});
