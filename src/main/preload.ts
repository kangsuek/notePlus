import { contextBridge, ipcRenderer } from 'electron';

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
    // 허용된 채널만 통과
    const validChannels = [
      'file:new',
      'file:open',
      'file:save',
      'file:saveAs',
      'window:minimize',
      'window:maximize',
      'window:close',
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  // 메인 프로세스로부터 메시지 수신
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = [
      'file:opened',
      'file:saved',
      'menu:action',
      'menu:new-file',
      'menu:open-file',
      'menu:save-file',
      'menu:save-file-as',
      'menu:toggle-sidebar',
      'menu:find',
      'menu:replace',
      'menu:shortcuts',
      'menu:about',
      'menu:preferences',
      'theme:changed',
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },

  // 메인 프로세스에 요청하고 응답 받기
  invoke: async (channel: string, ...args: unknown[]) => {
    const validChannels = [
      'dialog:openFile',
      'dialog:saveFile',
      'file:read',
      'file:write',
      'recentFiles:get',
      'recentFiles:remove',
      'app:getPath',
    ];

    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, ...args);
    }

    throw new Error(`Invalid channel: ${channel}`);
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

