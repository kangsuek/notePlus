import { ipcMain } from 'electron';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { detectEncoding } from '../utils/encodingDetector';
import iconv from 'iconv-lite';

/**
 * 파일 I/O 핸들러 설정
 */
export function setupFileHandlers() {
  ipcMain.handle(
    'file:write',
    async (_event, filePath: string, content: string, encoding: string = 'UTF-8') => {
      try {
        // 디렉토리가 존재하지 않으면 생성
        const dir = filePath.substring(0, filePath.lastIndexOf('/'));
        if (dir && !existsSync(dir)) {
          await fs.mkdir(dir, { recursive: true });
        }

        let buffer: Buffer;
        if (encoding === 'UTF-8') {
          buffer = Buffer.from(content, 'utf8');
        } else if (encoding === 'UTF-8(BOM)') {
          const utf8Content = Buffer.from(content, 'utf8');
          const bom = Buffer.from([0xef, 0xbb, 0xbf]);
          buffer = Buffer.concat([bom, utf8Content]);
        } else {
          // 다른 인코딩의 경우 iconv-lite 사용
          buffer = iconv.encode(content, encoding);
        }

        await fs.writeFile(filePath, buffer);
        return { success: true };
      } catch (error) {
        console.error('File write error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      if (!existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }

      // 파일 읽기
      const buffer = await fs.readFile(filePath);
      
      // 인코딩 감지
      const detectedEncoding = detectEncoding(buffer);
      
      let content: string;
      if (detectedEncoding === 'UTF-8') {
        content = buffer.toString('utf8');
      } else if (detectedEncoding === 'UTF-8(BOM)') {
        // BOM 제거
        content = buffer.toString('utf8').replace(/^\uFEFF/, '');
      } else {
        // 다른 인코딩의 경우 iconv-lite 사용
        content = iconv.decode(buffer, detectedEncoding);
      }

      return {
        success: true,
        content,
        encoding: detectedEncoding,
      };
    } catch (error) {
      console.error('File read error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
