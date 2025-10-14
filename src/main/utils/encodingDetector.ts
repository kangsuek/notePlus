import jschardet from 'jschardet';

/**
 * Detects the encoding of a file buffer
 * @param buffer - The file buffer to analyze
 * @returns The detected encoding name (e.g., "UTF-8", "UTF-16LE", "EUC-KR")
 */
export function detectEncoding(buffer: Buffer): string {
  // Handle empty files
  if (buffer.length === 0) {
    return 'UTF-8';
  }

  // Check for BOM (Byte Order Mark)
  const bomEncoding = detectBOM(buffer);
  if (bomEncoding) {
    return bomEncoding;
  }

  // Use first 64KB for detection (performance optimization)
  const sampleSize = Math.min(buffer.length, 64 * 1024);
  const sample = buffer.slice(0, sampleSize);

  // Use jschardet for automatic detection
  const detected = jschardet.detect(sample);

  // Normalize and return encoding
  return normalizeEncoding(detected.encoding, detected.confidence);
}

/**
 * Detects BOM (Byte Order Mark) at the beginning of buffer
 * @param buffer - The buffer to check
 * @returns The encoding if BOM is detected, null otherwise
 */
function detectBOM(buffer: Buffer): string | null {
  if (buffer.length < 2) {
    return null;
  }

  // UTF-8 BOM: EF BB BF
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return 'UTF-8(BOM)';
  }

  // UTF-16 LE BOM: FF FE
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return 'UTF-16LE';
  }

  // UTF-16 BE BOM: FE FF
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    return 'UTF-16BE';
  }

  return null;
}

/**
 * Normalizes encoding names from jschardet to standard names
 * @param encoding - The encoding name from jschardet
 * @param confidence - The confidence level (0-1)
 * @returns Normalized encoding name
 */
function normalizeEncoding(encoding: string | null, confidence: number): string {
  // If no encoding detected or low confidence, default to UTF-8
  if (!encoding || confidence < 0.5) {
    return 'UTF-8';
  }

  // Normalize encoding names to standard Node.js/iconv-lite format
  const normalized = encoding.toUpperCase();

  // Map jschardet encoding names to iconv-lite encoding names
  const encodingMap: Record<string, string> = {
    'UTF-8': 'UTF-8',
    'UTF-16LE': 'UTF-16LE',
    'UTF-16BE': 'UTF-16BE',
    'UTF-32LE': 'UTF-32LE',
    'UTF-32BE': 'UTF-32BE',
    'ISO-8859-1': 'ISO-8859-1',
    'ISO-8859-2': 'ISO-8859-2',
    'WINDOWS-1252': 'windows-1252',
    'WINDOWS-1251': 'windows-1251',
    'EUC-KR': 'EUC-KR',
    'CP949': 'CP949',
    'EUC-JP': 'EUC-JP',
    'SHIFT_JIS': 'SHIFT_JIS',
    'GB2312': 'GB2312',
    'GBK': 'GBK',
    'BIG5': 'BIG5',
    'ASCII': 'UTF-8', // ASCII is a subset of UTF-8
  };

  // Return mapped encoding or the normalized name if not in map
  return encodingMap[normalized] || encoding;
}
