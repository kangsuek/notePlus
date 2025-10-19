import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { setupMenu } from './menu';
import { setupAllHandlers } from './handlers';

// 개발 환경 확인
const isDev = process.env.NODE_ENV === 'development';

// 메인 윈도우 인스턴스
let mainWindow: BrowserWindow | null = null;

// 윈도우 확장 타입 정의
interface ExtendedBrowserWindow extends BrowserWindow {
  __forceClose?: boolean;
}

/**
 * 저장 시간 초과 시 강제 종료 확인
 */
async function confirmForceClose(window: BrowserWindow): Promise<boolean> {
  const { response } = await dialog.showMessageBox(window, {
    type: 'warning',
    buttons: ['강제 종료', '취소'],
    defaultId: 1,
    cancelId: 1,
    title: '저장 시간 초과',
    message: '파일 저장이 완료되지 않았습니다.',
    detail: '그래도 종료하시겠습니까? 변경사항이 손실될 수 있습니다.',
  });
  return response === 0;
}

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
    void mainWindow.loadURL('http://localhost:5173');
    // 개발자 도구는 필요시 Cmd+Option+I (macOS) 또는 F12로 열기
    // mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션에서는 빌드된 파일 로드
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 윈도우가 닫히려고 할 때
  mainWindow.on('close', (event) => {
    // 강제 종료가 아닌 경우에만 확인
    if (!(mainWindow as ExtendedBrowserWindow).__forceClose) {
      event.preventDefault();

      // 비동기로 isDirty 상태 확인
      void (async () => {
        try {
          if (!mainWindow) return;

          // 렌더러 프로세스에서 isDirty 상태 확인
          const isDirty = (await mainWindow.webContents.executeJavaScript(
            'window.__isDirty__ !== undefined ? window.__isDirty__ : false'
          )) as boolean;

          if (isDirty) {
            // 변경사항이 있으면 저장 확인 다이얼로그 표시
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['저장', '저장 안 함', '취소'],
              defaultId: 0,
              cancelId: 2,
              title: '변경사항 저장',
              message: '변경사항을 저장하시겠습니까?',
              detail: '저장하지 않으면 변경사항이 손실됩니다.',
            });

            if (response === 0) {
              // 저장 버튼 클릭
              mainWindow.webContents.send('menu:save-file');

              // 저장 완료 대기 (최대 5초)
              let saved = false;
              for (let i = 0; i < 50; i++) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                if (!mainWindow) break;
                const currentIsDirty = (await mainWindow.webContents.executeJavaScript(
                  'window.__isDirty__ !== undefined ? window.__isDirty__ : false'
                )) as boolean;
                if (!currentIsDirty) {
                  saved = true;
                  break;
                }
              }

              if (saved || (mainWindow && (await confirmForceClose(mainWindow)))) {
                if (mainWindow) {
                  (mainWindow as ExtendedBrowserWindow).__forceClose = true;
                  mainWindow.close();
                  // macOS에서도 명시적으로 app.quit() 호출
                  app.quit();
                }
              }
            } else if (response === 1) {
              // 저장 안 함 버튼 클릭 - 바로 종료
              if (mainWindow) {
                (mainWindow as ExtendedBrowserWindow).__forceClose = true;
                mainWindow.close();
                // macOS에서도 명시적으로 app.quit() 호출
                app.quit();
              }
            }
            // response === 2 (취소) - 아무것도 하지 않음
          } else {
            // 변경사항 없음 - 바로 종료
            if (mainWindow) {
              (mainWindow as ExtendedBrowserWindow).__forceClose = true;
              mainWindow.close();
              // macOS에서도 명시적으로 app.quit() 호출
              app.quit();
            }
          }
        } catch (error) {
          console.error('Failed to check isDirty state:', error);
          // 에러 발생 시 바로 종료
          if (mainWindow) {
            (mainWindow as ExtendedBrowserWindow).__forceClose = true;
            mainWindow.close();
            // macOS에서도 명시적으로 app.quit() 호출
            app.quit();
          }
        }
      })();
    }
  });

  // 윈도우가 닫힐 때
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // IPC 핸들러 설정
  setupAllHandlers();

  // 메뉴 설정
  setupMenu(mainWindow);
}

// 앱이 준비되면 윈도우 생성
void app.whenReady().then(() => {
  createWindow();

  // macOS에서 독 아이콘 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 앱 종료 전 정리
app.on('before-quit', () => {
  // 필요한 정리 작업 수행
});

// 개발 모드에서 보안 경고 비활성화
if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}
