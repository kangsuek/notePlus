import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { RecentFilesManager } from './RecentFilesManager';
import { SettingsManager } from './SettingsManager';
import { existsSync } from 'fs';
import { setupMenu } from './menu';
import { detectEncoding } from './utils/encodingDetector';
import iconv from 'iconv-lite';

// 개발 환경 확인
const isDev = process.env.NODE_ENV === 'development';

// 메인 윈도우 인스턴스
let mainWindow: BrowserWindow | null = null;

// 최근 파일 관리자
const recentFilesManager = new RecentFilesManager();

// 설정 관리자
const settingsManager = new SettingsManager();

// 최근 저장/열기 위치 기억
let lastSavePath: string | undefined;
let lastOpenPath: string | undefined;

/**
 * 메인 윈도우 생성 함수
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // macOS 네이티브 스타일
    webPreferences: {
      // 보안 설정
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // Preload 스크립트
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // 준비될 때까지 숨김
  });

  // 윈도우 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 개발 모드에서는 Vite 개발 서버 로드
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // 개발자 도구는 필요시 Cmd+Option+I (macOS) 또는 F12로 열기
    // mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션에서는 빌드된 파일 로드
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 윈도우 닫기 전 확인 (저장하지 않은 변경사항이 있을 경우)
  mainWindow.on('close', async (event) => {
    if (!mainWindow) return;

    // 렌더러로부터 저장 여부 확인 (isDirty 상태 확인)
    // 렌더러에서 beforeunload 이벤트로 처리
  });

  // 윈도우가 닫힐 때
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * IPC 핸들러 설정
 */
function setupIpcHandlers() {
  // 파일 저장 다이얼로그
  ipcMain.handle('dialog:saveFile', async (_event, currentFileName?: string) => {
    if (!mainWindow) return { canceled: true };

    // 기본 경로 설정: 현재 파일명이 있으면 사용, 없으면 최근 저장 위치 또는 Documents 폴더
    let defaultPath: string;
    if (currentFileName) {
      // 현재 파일명이 있으면 해당 파일명을 기본값으로 사용
      defaultPath = lastSavePath
        ? path.join(path.dirname(lastSavePath), currentFileName)
        : path.join(app.getPath('documents'), currentFileName);
    } else {
      // 현재 파일명이 없으면 기존 로직 사용
      defaultPath = lastSavePath
        ? path.join(path.dirname(lastSavePath), 'untitled.md')
        : path.join(app.getPath('documents'), 'untitled.md');
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      title: '파일 저장',
      defaultPath,
      filters: [
        { name: '모든 파일', extensions: ['*'] },
        { name: 'Markdown 파일', extensions: ['md'] },
        { name: '텍스트 파일', extensions: ['txt'] },
        { name: 'JSON 파일', extensions: ['json'] },
        { name: 'JavaScript 파일', extensions: ['js'] },
        { name: 'TypeScript 파일', extensions: ['ts'] },
        { name: 'HTML 파일', extensions: ['html', 'htm'] },
        { name: 'CSS 파일', extensions: ['css'] },
        { name: 'Python 파일', extensions: ['py'] },
        { name: 'Java 파일', extensions: ['java'] },
        { name: 'C 파일', extensions: ['c'] },
        { name: 'C++ 파일', extensions: ['cpp', 'cc', 'cxx'] },
        { name: 'C# 파일', extensions: ['cs'] },
        { name: 'PHP 파일', extensions: ['php'] },
        { name: 'Ruby 파일', extensions: ['rb'] },
        { name: 'Go 파일', extensions: ['go'] },
        { name: 'Rust 파일', extensions: ['rs'] },
        { name: 'Swift 파일', extensions: ['swift'] },
        { name: 'Kotlin 파일', extensions: ['kt'] },
        { name: 'XML 파일', extensions: ['xml'] },
        { name: 'YAML 파일', extensions: ['yml', 'yaml'] },
        { name: 'TOML 파일', extensions: ['toml'] },
        { name: 'INI 파일', extensions: ['ini'] },
        { name: 'Properties 파일', extensions: ['properties'] },
        { name: 'Log 파일', extensions: ['log'] },
        { name: 'CSV 파일', extensions: ['csv'] },
        { name: 'SQL 파일', extensions: ['sql'] },
        { name: 'Shell 스크립트', extensions: ['sh', 'bash'] },
        { name: 'Batch 파일', extensions: ['bat', 'cmd'] },
        { name: 'PowerShell 파일', extensions: ['ps1'] },
        { name: 'Dockerfile', extensions: ['dockerfile'] },
        { name: 'Makefile', extensions: ['makefile', 'mk'] },
        { name: 'Gitignore', extensions: ['gitignore'] },
        { name: 'README', extensions: ['readme'] },
        { name: 'LICENSE', extensions: ['license'] },
        { name: 'CHANGELOG', extensions: ['changelog'] },
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });

    // 파일이 선택되면 경로 저장
    if (!result.canceled && result.filePath) {
      lastSavePath = result.filePath;
    }

    return result;
  });

  // 파일 열기 다이얼로그
  ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow) return { canceled: true };

    // 기본 경로 설정: 최근 열기 위치 또는 Documents 폴더
    const defaultPath = lastOpenPath ? path.dirname(lastOpenPath) : app.getPath('documents');

    const result = await dialog.showOpenDialog(mainWindow, {
      title: '파일 열기',
      defaultPath,
      filters: [
        { name: '모든 파일', extensions: ['*'] },
        { name: 'Markdown 파일', extensions: ['md'] },
        { name: '텍스트 파일', extensions: ['txt'] },
        { name: 'JSON 파일', extensions: ['json'] },
        { name: 'JavaScript 파일', extensions: ['js'] },
        { name: 'TypeScript 파일', extensions: ['ts'] },
        { name: 'HTML 파일', extensions: ['html', 'htm'] },
        { name: 'CSS 파일', extensions: ['css'] },
        { name: 'Python 파일', extensions: ['py'] },
        { name: 'Java 파일', extensions: ['java'] },
        { name: 'C 파일', extensions: ['c'] },
        { name: 'C++ 파일', extensions: ['cpp', 'cc', 'cxx'] },
        { name: 'C# 파일', extensions: ['cs'] },
        { name: 'PHP 파일', extensions: ['php'] },
        { name: 'Ruby 파일', extensions: ['rb'] },
        { name: 'Go 파일', extensions: ['go'] },
        { name: 'Rust 파일', extensions: ['rs'] },
        { name: 'Swift 파일', extensions: ['swift'] },
        { name: 'Kotlin 파일', extensions: ['kt'] },
        { name: 'XML 파일', extensions: ['xml'] },
        { name: 'YAML 파일', extensions: ['yml', 'yaml'] },
        { name: 'TOML 파일', extensions: ['toml'] },
        { name: 'INI 파일', extensions: ['ini'] },
        { name: 'Properties 파일', extensions: ['properties'] },
        { name: 'Log 파일', extensions: ['log'] },
        { name: 'CSV 파일', extensions: ['csv'] },
        { name: 'SQL 파일', extensions: ['sql'] },
        { name: 'Shell 스크립트', extensions: ['sh', 'bash'] },
        { name: 'Batch 파일', extensions: ['bat', 'cmd'] },
        { name: 'PowerShell 파일', extensions: ['ps1'] },
        { name: 'Dockerfile', extensions: ['dockerfile'] },
        { name: 'Makefile', extensions: ['makefile', 'mk'] },
        { name: 'Gitignore', extensions: ['gitignore'] },
        { name: 'README', extensions: ['readme'] },
        { name: 'LICENSE', extensions: ['license'] },
        { name: 'CHANGELOG', extensions: ['changelog'] },
      ],
      properties: ['openFile'], // 단일 파일 선택
    });

    // 파일이 선택되면 경로 저장
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      lastOpenPath = result.filePaths[0];
    }

    return result;
  });

  // 파일 저장
  ipcMain.handle(
    'file:write',
    async (_event, filePath: string, content: string, encoding: string = 'UTF-8') => {
      try {
        console.log(`Saving file with encoding: ${encoding}`);

        let buffer: Buffer;

        // 인코딩에 따라 버퍼 생성
        if (encoding === 'UTF-8(BOM)') {
          // UTF-8 BOM 추가
          const bom = Buffer.from([0xef, 0xbb, 0xbf]);
          const contentBuffer = Buffer.from(content, 'utf8');
          buffer = Buffer.concat([bom, contentBuffer]);
          console.log('Added UTF-8 BOM');
        } else if (encoding === 'UTF-8') {
          // UTF-8 (BOM 없음)
          buffer = Buffer.from(content, 'utf8');
        } else if (encoding === 'UTF-16LE') {
          // UTF-16LE BOM 추가
          const bom = Buffer.from([0xff, 0xfe]);
          const contentBuffer = iconv.encode(content, 'UTF-16LE');
          buffer = Buffer.concat([bom, contentBuffer]);
          console.log('Added UTF-16LE BOM');
        } else if (encoding === 'UTF-16BE') {
          // UTF-16BE BOM 추가
          const bom = Buffer.from([0xfe, 0xff]);
          const contentBuffer = iconv.encode(content, 'UTF-16BE');
          buffer = Buffer.concat([bom, contentBuffer]);
          console.log('Added UTF-16BE BOM');
        } else {
          // 기타 인코딩 (EUC-KR, CP949 등)
          buffer = iconv.encode(content, encoding);
        }

        // 파일 쓰기
        await fs.writeFile(filePath, buffer);

        // 최근 파일 목록에 추가
        recentFilesManager.addFile(filePath);
        // 메뉴 업데이트
        updateMenu();
        return { success: true };
      } catch (error) {
        console.error('Failed to write file:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // 파일 읽기
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      // Read file as binary buffer first
      const buffer = await fs.readFile(filePath);

      // Detect encoding
      const encoding = detectEncoding(buffer);
      console.log(`Detected encoding for ${filePath}: ${encoding}`);

      // Remove BOM if present and decode
      let content: string;
      let bufferWithoutBOM = buffer;

      // BOM 제거
      if (encoding === 'UTF-8' || encoding === 'UTF-8(BOM)') {
        // UTF-8 BOM: EF BB BF
        if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
          bufferWithoutBOM = buffer.subarray(3);
          console.log('Removed UTF-8 BOM');
        }
      } else if (encoding === 'UTF-16LE') {
        // UTF-16LE BOM: FF FE
        if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
          bufferWithoutBOM = buffer.subarray(2);
          console.log('Removed UTF-16LE BOM');
        }
      } else if (encoding === 'UTF-16BE') {
        // UTF-16BE BOM: FE FF
        if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
          bufferWithoutBOM = buffer.subarray(2);
          console.log('Removed UTF-16BE BOM');
        }
      }

      // 디코딩
      try {
        if (encoding === 'UTF-8' || encoding === 'UTF-8(BOM)') {
          // UTF-8은 Node.js 네이티브 디코딩 사용
          content = bufferWithoutBOM.toString('utf8');
        } else if (encoding === 'UTF-16LE' || encoding === 'UTF-16BE') {
          // UTF-16은 iconv-lite 사용 (더 안정적)
          content = iconv.decode(bufferWithoutBOM, encoding);
        } else {
          // 기타 인코딩 (EUC-KR, CP949 등)
          content = iconv.decode(bufferWithoutBOM, encoding);
        }
      } catch (decodeError) {
        console.warn(`Failed to decode with ${encoding}, falling back to UTF-8:`, decodeError);
        content = buffer.toString('utf8');
      }

      // 최근 파일 목록에 추가
      recentFilesManager.addFile(filePath);
      // 메뉴 업데이트
      updateMenu();

      return { success: true, content, encoding };
    } catch (error) {
      console.error('Failed to read file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 최근 파일 목록에 추가
  ipcMain.handle('recentFiles:add', async (_event, filePath: string) => {
    try {
      recentFilesManager.addFile(filePath);
      // 메뉴 업데이트
      updateMenu();
      return { success: true };
    } catch (error) {
      console.error('Failed to add recent file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 최근 파일 목록 조회
  ipcMain.handle('recentFiles:get', async () => {
    try {
      const files = recentFilesManager.getFiles();
      // 파일 존재 여부 검증 및 필터링 (드래그 앤 드롭 파일 제외)
      const validFiles = files.filter((file) => {
        // 드래그 앤 드롭 파일은 존재 여부 검증 건너뛰기
        if (file.path.startsWith('dropped:')) {
          return true;
        }

        const exists = existsSync(file.path);
        // 존재하지 않는 파일은 목록에서 제거
        if (!exists) {
          recentFilesManager.removeFile(file.path);
        }
        return exists;
      });
      return { success: true, files: validFiles };
    } catch (error) {
      console.error('Failed to get recent files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 최근 파일에서 제거
  ipcMain.handle('recentFiles:remove', async (_event, filePath: string) => {
    try {
      recentFilesManager.removeFile(filePath);
      return { success: true };
    } catch (error) {
      console.error('Failed to remove recent file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 설정 조회
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = settingsManager.getSettings();
      return { success: true, settings };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 설정 저장
  ipcMain.handle('settings:save', async (_event, settings) => {
    try {
      settingsManager.saveSettings(settings);
      return { success: true };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 설정 초기화
  ipcMain.handle('settings:reset', async () => {
    try {
      settingsManager.resetSettings();
      return { success: true };
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}

/**
 * 메뉴 업데이트 함수
 */
function updateMenu() {
  const recentFiles = recentFilesManager.getFiles();
  setupMenu(mainWindow, recentFiles);
}

/**
 * Electron 앱 준비 완료
 */
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
  updateMenu(); // 메뉴 설정

  // macOS에서 dock 아이콘 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * 모든 윈도우가 닫힐 때
 * macOS를 제외하고는 앱 종료
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * 앱 종료 전 정리 작업
 */
app.on('before-quit', () => {
  // 필요한 정리 작업 수행
});
