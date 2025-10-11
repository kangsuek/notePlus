import Store from 'electron-store';

/**
 * 최근 파일 정보
 */
export interface RecentFile {
  path: string;
  lastOpened: Date;
}

/**
 * 최근 문서 관리 클래스
 * electron-store를 사용하여 최근 열었던 파일 목록을 영구 저장
 */
export class RecentFilesManager {
  private store: Store;
  private readonly MAX_FILES = 10;
  private readonly STORE_KEY = 'recentFiles';

  constructor() {
    this.store = new Store({
      name: 'recent-files',
    });
  }

  /**
   * 파일을 최근 목록에 추가
   * 이미 존재하는 파일이면 맨 위로 이동
   * 
   * @param filePath 파일 경로
   */
  addFile(filePath: string): void {
    const files = this.getFiles();
    
    // 기존 파일 제거 (있으면)
    const filteredFiles = files.filter((file) => file.path !== filePath);
    
    // 새 파일을 맨 앞에 추가
    const newFile: RecentFile = {
      path: filePath,
      lastOpened: new Date(),
    };
    
    filteredFiles.unshift(newFile);
    
    // 최대 개수 제한
    const limitedFiles = filteredFiles.slice(0, this.MAX_FILES);
    
    // 저장
    this.saveFiles(limitedFiles);
  }

  /**
   * 파일을 최근 목록에서 제거
   * 
   * @param filePath 파일 경로
   */
  removeFile(filePath: string): void {
    const files = this.getFiles();
    const filteredFiles = files.filter((file) => file.path !== filePath);
    this.saveFiles(filteredFiles);
  }

  /**
   * 최근 파일 목록 조회
   * lastOpened 기준으로 정렬 (최근 순)
   * 
   * @returns 최근 파일 목록
   */
  getFiles(): RecentFile[] {
    const data = this.store.get(this.STORE_KEY, []) as any[];
    
    // Date 객체로 변환
    return data.map((item) => ({
      path: item.path,
      lastOpened: new Date(item.lastOpened),
    }));
  }

  /**
   * 특정 파일이 목록에 있는지 확인
   * 
   * @param filePath 파일 경로
   * @returns 존재 여부
   */
  hasFile(filePath: string): boolean {
    const files = this.getFiles();
    return files.some((file) => file.path === filePath);
  }

  /**
   * 모든 최근 파일 목록 삭제
   */
  clear(): void {
    this.store.delete(this.STORE_KEY);
  }

  /**
   * 파일 목록 저장 (내부 사용)
   */
  private saveFiles(files: RecentFile[]): void {
    this.store.set(this.STORE_KEY, files);
  }
}

