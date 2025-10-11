import { Menu, BrowserWindow, MenuItemConstructorOptions, app, shell } from 'electron';

/**
 * 애플리케이션 메뉴 생성
 * macOS 네이티브 스타일 메뉴바
 */
export function createMenu(mainWindow: BrowserWindow | null): Menu {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // macOS: App 메뉴
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              {
                label: `${app.name} 정보`,
                role: 'about' as const,
              },
              { type: 'separator' as const },
              {
                label: '환경설정...',
                accelerator: 'Cmd+,',
                click: () => {
                  mainWindow?.webContents.send('menu:preferences');
                },
              },
              { type: 'separator' as const },
              {
                label: '서비스',
                role: 'services' as const,
              },
              { type: 'separator' as const },
              {
                label: `${app.name} 가리기`,
                role: 'hide' as const,
              },
              {
                label: '다른 항목 가리기',
                role: 'hideOthers' as const,
              },
              {
                label: '모두 보기',
                role: 'unhide' as const,
              },
              { type: 'separator' as const },
              {
                label: '종료',
                role: 'quit' as const,
              },
            ],
          },
        ]
      : []),

    // File 메뉴
    {
      label: '파일',
      submenu: [
        {
          label: '새 파일',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu:new-file');
          },
        },
        {
          label: '열기...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu:open-file');
          },
        },
        { type: 'separator' as const },
        {
          label: '저장',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:save-file');
          },
        },
        {
          label: '다른 이름으로 저장...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow?.webContents.send('menu:save-file-as');
          },
        },
        { type: 'separator' as const },
        {
          label: '최근 파일',
          submenu: [
            {
              label: '최근 파일 없음',
              enabled: false,
            },
          ],
        },
        { type: 'separator' as const },
        ...(isMac
          ? [
              {
                label: '닫기',
                accelerator: 'Cmd+W',
                role: 'close' as const,
              },
            ]
          : [
              {
                label: '종료',
                accelerator: 'Ctrl+Q',
                role: 'quit' as const,
              },
            ]),
      ],
    },

    // Edit 메뉴
    {
      label: '편집',
      submenu: [
        {
          label: '실행 취소',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo' as const,
        },
        {
          label: '다시 실행',
          accelerator: isMac ? 'Cmd+Y' : 'Ctrl+Y',
          role: 'redo' as const,
        },
        { type: 'separator' as const },
        {
          label: '잘라내기',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut' as const,
        },
        {
          label: '복사',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy' as const,
        },
        {
          label: '붙여넣기',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste' as const,
        },
        {
          label: '모두 선택',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll' as const,
        },
        { type: 'separator' as const },
        {
          label: '찾기...',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow?.webContents.send('menu:find');
          },
        },
        {
          label: '바꾸기...',
          accelerator: isMac ? 'Cmd+H' : 'Ctrl+H',
          click: () => {
            mainWindow?.webContents.send('menu:replace');
          },
        },
      ],
    },

    // View 메뉴
    {
      label: '보기',
      submenu: [
        {
          label: '사이드바 토글',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow?.webContents.send('menu:toggle-sidebar');
          },
        },
        { type: 'separator' as const },
        {
          label: '새로고침',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload' as const,
        },
        {
          label: '강제 새로고침',
          accelerator: 'CmdOrCtrl+Shift+R',
          role: 'forceReload' as const,
        },
        {
          label: '개발자 도구',
          accelerator: isMac ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
          role: 'toggleDevTools' as const,
        },
        { type: 'separator' as const },
        {
          label: '실제 크기',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetZoom' as const,
        },
        {
          label: '확대',
          accelerator: 'CmdOrCtrl+Plus',
          role: 'zoomIn' as const,
        },
        {
          label: '축소',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomOut' as const,
        },
        { type: 'separator' as const },
        {
          label: '전체 화면',
          accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
          role: 'togglefullscreen' as const,
        },
      ],
    },

    // Window 메뉴
    {
      label: '윈도우',
      submenu: [
        {
          label: '최소화',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize' as const,
        },
        {
          label: '확대/축소',
          role: 'zoom' as const,
        },
        ...(isMac
          ? [
              { type: 'separator' as const },
              {
                label: '앞으로 가져오기',
                role: 'front' as const,
              },
              { type: 'separator' as const },
              {
                label: '윈도우',
                role: 'window' as const,
              },
            ]
          : [
              {
                label: '닫기',
                accelerator: 'Ctrl+W',
                role: 'close' as const,
              },
            ]),
      ],
    },

    // Help 메뉴
    {
      label: '도움말',
      role: 'help' as const,
      submenu: [
        {
          label: '문서',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/noteplus');
          },
        },
        {
          label: '키보드 단축키',
          click: () => {
            mainWindow?.webContents.send('menu:shortcuts');
          },
        },
        { type: 'separator' as const },
        {
          label: '버그 리포트',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/noteplus/issues');
          },
        },
        ...(isMac
          ? []
          : [
              { type: 'separator' as const },
              {
                label: `${app.name} 정보`,
                click: () => {
                  mainWindow?.webContents.send('menu:about');
                },
              },
            ]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  return menu;
}

/**
 * 메뉴 설정
 */
export function setupMenu(mainWindow: BrowserWindow | null): void {
  const menu = createMenu(mainWindow);
  Menu.setApplicationMenu(menu);
}
