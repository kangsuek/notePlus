import Store from 'electron-store';

/**
 * 에디터 설정 인터페이스
 */
export interface EditorSettings {
  showLineNumbers: boolean;
  fontFamily: string;
  fontSize: number;
}

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS: EditorSettings = {
  showLineNumbers: true,
  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
  fontSize: 14,
};

/**
 * 설정 관리 클래스
 * electron-store를 사용하여 settings.json 형태로 설정 저장
 */
export class SettingsManager {
  private store: Store;
  private readonly STORE_KEY = 'editor';

  constructor() {
    this.store = new Store({
      name: 'settings',
      defaults: {
        editor: DEFAULT_SETTINGS,
      },
    });
  }

  /**
   * 설정 조회
   * @returns 현재 에디터 설정
   */
  getSettings(): EditorSettings {
    return this.store.get(this.STORE_KEY, DEFAULT_SETTINGS) as EditorSettings;
  }

  /**
   * 설정 저장
   * @param settings 저장할 설정
   */
  saveSettings(settings: Partial<EditorSettings>): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    this.store.set(this.STORE_KEY, newSettings);
  }

  /**
   * 특정 설정값 조회
   * @param key 설정 키
   * @returns 설정값
   */
  getSetting<K extends keyof EditorSettings>(key: K): EditorSettings[K] {
    const settings = this.getSettings();
    return settings[key];
  }

  /**
   * 특정 설정값 저장
   * @param key 설정 키
   * @param value 설정값
   */
  setSetting<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]): void {
    const settings = this.getSettings();
    settings[key] = value;
    this.store.set(this.STORE_KEY, settings);
  }

  /**
   * 설정 초기화 (기본값으로 복원)
   */
  resetSettings(): void {
    this.store.set(this.STORE_KEY, DEFAULT_SETTINGS);
  }

  /**
   * 모든 설정 삭제
   */
  clearSettings(): void {
    this.store.delete(this.STORE_KEY);
  }
}
