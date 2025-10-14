import React, { useState, useEffect } from 'react';
import './Preferences.css';

interface EditorSettings {
  showLineNumbers: boolean;
  fontFamily: string;
  fontSize: number;
}

interface PreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: EditorSettings) => void;
}

const Preferences: React.FC<PreferencesProps> = ({ isOpen, onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState<EditorSettings>({
    showLineNumbers: true,
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    fontSize: 14,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 설정 로드
  useEffect(() => {
    if (isOpen && window.electronAPI) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = (await window.electronAPI.invoke('settings:get')) as {
        success: boolean;
        settings?: EditorSettings;
      };
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const result = (await window.electronAPI.invoke('settings:save', settings)) as {
        success: boolean;
      };
      if (result.success) {
        // 설정이 저장되었음을 알림 - 즉시 반영
        if (onSettingsChange) {
          onSettingsChange(settings);
        }
        onClose();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      return;
    }

    try {
      const result = (await window.electronAPI.invoke('settings:reset')) as {
        success: boolean;
      };
      if (result.success) {
        await loadSettings();
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="preferences-overlay" onClick={handleCancel}>
      <div className="preferences-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="preferences-header">
          <h2>설정</h2>
          <button className="close-button" onClick={handleCancel} aria-label="닫기">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="preferences-loading">로딩 중...</div>
        ) : (
          <div className="preferences-content">
            <div className="preferences-section">
              <h3>에디터</h3>

              <div className="preference-item">
                <label className="preference-label">
                  <input
                    type="checkbox"
                    checked={settings.showLineNumbers}
                    onChange={(e) =>
                      setSettings({ ...settings, showLineNumbers: e.target.checked })
                    }
                  />
                  <span>줄 번호 표시</span>
                </label>
              </div>

              <div className="preference-item">
                <label className="preference-label">
                  <span>폰트</span>
                </label>
                <input
                  type="text"
                  className="preference-input"
                  value={settings.fontFamily}
                  onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                  placeholder='Monaco, Menlo, "Courier New", monospace'
                />
                <div className="preference-hint">
                  쉼표로 구분하여 여러 폰트를 지정하면 왼쪽부터 순서대로 사용 가능한 폰트를
                  찾습니다.
                </div>
              </div>

              <div className="preference-item">
                <label className="preference-label">
                  <span>폰트 크기</span>
                </label>
                <div className="preference-input-group">
                  <input
                    type="number"
                    className="preference-input"
                    value={settings.fontSize}
                    onChange={(e) =>
                      setSettings({ ...settings, fontSize: parseInt(e.target.value) || 14 })
                    }
                    min="8"
                    max="72"
                  />
                  <span className="preference-unit">px</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="preferences-footer">
          <button className="preference-button preference-button-secondary" onClick={handleReset}>
            초기화
          </button>
          <div className="preferences-footer-right">
            <button
              className="preference-button preference-button-secondary"
              onClick={handleCancel}
            >
              취소
            </button>
            <button
              className="preference-button preference-button-primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
