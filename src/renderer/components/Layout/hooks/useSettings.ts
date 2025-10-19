import { useState, useEffect } from 'react';

export interface EditorSettings {
  showLineNumbers: boolean;
  fontFamily: string;
  fontSize: number;
}

export interface UseSettingsProps {
  onSettingsChange?: (settings: EditorSettings) => void;
}

export function useSettings({ onSettingsChange }: UseSettingsProps = {}) {
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    showLineNumbers: true,
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    fontSize: 14,
  });

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) return;

      try {
        const result = (await window.electronAPI.invoke('settings:get')) as {
          success: boolean;
          settings?: EditorSettings;
        };
        if (result.success && result.settings) {
          setEditorSettings(result.settings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSettingsChange = (newSettings: EditorSettings) => {
    setEditorSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return {
    editorSettings,
    setEditorSettings,
    handleSettingsChange,
  };
}
