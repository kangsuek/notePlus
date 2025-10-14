declare module 'jschardet' {
  export interface DetectionResult {
    encoding: string | null;
    confidence: number;
  }

  export function detect(buffer: Buffer | Uint8Array): DetectionResult;
}
