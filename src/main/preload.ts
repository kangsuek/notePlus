import { contextBridge, ipcRenderer } from 'electron';

/**
 * 보안 검증을 위한 허용된 채널 목록
 */
const ALLOWED_SEND_CHANNELS = [
  'file:new',
  'file:open',
  'file:save',
  'file:saveAs',
  'window:minimize',
  'window:maximize',
  'window:close',
  'settings:changed',
] as const;

const ALLOWED_ON_CHANNELS = [
  'file:opened',
  'file:saved',
  'menu:action',
  'menu:new-file',
  'menu:open-file',
  'menu:save-file',
  'menu:save-file-as',
  'menu:toggle-sidebar',
  'menu:open-recent-file',
  'menu:find',
  'menu:replace',
  'menu:shortcuts',
  'menu:about',
  'menu:preferences',
  'theme:changed',
  'settings:changed',
] as const;

const ALLOWED_INVOKE_CHANNELS = [
  'dialog:openFile',
  'dialog:saveFile',
  'file:read',
  'file:write',
  'recentFiles:add',
  'recentFiles:get',
  'recentFiles:remove',
  'settings:get',
  'settings:save',
  'settings:reset',
  'app:getPath',
] as const;

/**
 * 채널 검증 함수
 */
function isValidChannel(channel: string, allowedChannels: readonly string[]): boolean {
  return allowedChannels.includes(channel);
}

/**
 * 입력 데이터 검증 함수
 */
function validateInputData(data: unknown): boolean {
  if (data === null || data === undefined) {
    return true;
  }

  if (typeof data === 'string') {
    // 위험한 패턴 검사
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /\.\.\//g, // 경로 조작
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(data));
  }

  if (Array.isArray(data)) {
    return data.every((item) => validateInputData(item));
  }

  if (typeof data === 'object') {
    return Object.values(data).every((value) => validateInputData(value));
  }

  return true;
}

/**
 * Electron API 타입 정의
 */
export interface ElectronAPI {
  // IPC 통신
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;

  // 플랫폼 정보
  platform: NodeJS.Platform;
}

/**
 * 렌더러 프로세스에서 사용할 안전한 API
 */
const electronAPI: ElectronAPI = {
  // 메인 프로세스로 메시지 전송
  send: (channel: string, ...args: unknown[]) => {
    // 채널 검증
    if (!isValidChannel(channel, ALLOWED_SEND_CHANNELS)) {
      console.warn(`Blocked unauthorized send channel: ${channel}`);
      return;
    }

    // 입력 데이터 검증
    if (!args.every((arg) => validateInputData(arg))) {
      console.warn(`Blocked dangerous data in send channel: ${channel}`);
      return;
    }

    ipcRenderer.send(channel, ...args);
  },

  // 메인 프로세스로부터 메시지 수신
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    // 채널 검증
    if (!isValidChannel(channel, ALLOWED_ON_CHANNELS)) {
      console.warn(`Blocked unauthorized on channel: ${channel}`);
      return;
    }

    ipcRenderer.on(channel, (_event, ...args) => {
      // 수신된 데이터 검증
      if (args.every((arg) => validateInputData(arg))) {
        callback(...args);
      } else {
        console.warn(`Blocked dangerous data in on channel: ${channel}`);
      }
    });
  },

  // 메인 프로세스에 요청하고 응답 받기
  invoke: async (channel: string, ...args: unknown[]) => {
    // 채널 검증
    if (!isValidChannel(channel, ALLOWED_INVOKE_CHANNELS)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    // 입력 데이터 검증
    if (!args.every((arg) => validateInputData(arg))) {
      throw new Error(`Invalid data for channel: ${channel}`);
    }

    return await ipcRenderer.invoke(channel, ...args);
  },

  // 플랫폼 정보
  platform: process.platform,
};

/**
 * contextBridge를 통해 안전하게 API 노출
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript용 타입 선언
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
