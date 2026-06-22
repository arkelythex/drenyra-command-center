export function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error('Clipboard API no disponible'));
}

function isBrowserCryptoAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.crypto !== 'undefined' && typeof window.crypto.subtle !== 'undefined';
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildDelimitedText(headers: string[], rows: Array<Array<unknown>>, delimiter: ',' | '\t'): string {
  const headerLine = headers.map((cell) => escapeCsvCell(cell)).join(delimiter);
  const rowLines = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(delimiter));
  return [headerLine, ...rowLines].join('\n');
}

function triggerDownload(filename: string, content: string, mimeType: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<unknown>>): void {
  const csv = buildDelimitedText(headers, rows, ',');
  // BOM improves compatibility with Excel + UTF-8 accents in Windows.
  const withBom = `\uFEFF${csv}`;
  triggerDownload(filename, withBom, 'text/csv;charset=utf-8');
}

export function buildTsvText(headers: string[], rows: Array<Array<unknown>>): string {
  return buildDelimitedText(headers, rows, '\t');
}

export function downloadJsonFile(filename: string, payload: unknown): void {
  const formatted = JSON.stringify(payload, null, 2);
  triggerDownload(filename, formatted, 'application/json;charset=utf-8');
}

export async function downloadEncryptedJsonBackup(
  filename: string,
  payload: unknown,
  passphrase: string,
): Promise<void> {
  if (!isBrowserCryptoAvailable()) {
    throw new Error('WebCrypto no está disponible en este navegador');
  }

  if (passphrase.trim().length < 12) {
    throw new Error('La contraseña debe tener al menos 12 caracteres');
  }

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(payload));
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await window.crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 250000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt'],
  );

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintext,
  );

  const envelope = {
    version: 'arkelythex.encrypted.backup.v1',
    createdAt: new Date().toISOString(),
    cipher: {
      algorithm: 'AES-GCM',
      keyLength: 256,
      iv: toBase64(iv),
      data: toBase64(new Uint8Array(ciphertext)),
    },
    kdf: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 250000,
      salt: toBase64(salt),
    },
  };

  downloadJsonFile(filename, envelope);
}
