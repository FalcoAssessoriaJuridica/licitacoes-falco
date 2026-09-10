import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

/**
 * Criptografia simétrica (AES-256-GCM) para guardar a chave de API da
 * Anthropic de cada usuário no banco sem deixá-la em texto puro.
 *
 * A chave-mestra vem de APP_ENCRYPTION_KEY (32 bytes em base64). Gere com:
 *   openssl rand -base64 32
 *
 * Formato do texto cifrado: "v1:" + base64( iv[12] | authTag[16] | ciphertext )
 */

const PREFIXO = 'v1:';

function chaveMestra(): Buffer {
  const b64 = process.env.APP_ENCRYPTION_KEY;
  if (!b64) {
    throw new Error(
      'APP_ENCRYPTION_KEY não definida. Gere com `openssl rand -base64 32` e ponha no .env.'
    );
  }
  const buf = Buffer.from(b64, 'base64');
  if (buf.length !== 32) {
    throw new Error(
      `APP_ENCRYPTION_KEY deve ter 32 bytes (base64 de 32 bytes); tem ${buf.length}.`
    );
  }
  return buf;
}

export function criptografar(textoPuro: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', chaveMestra(), iv);
  const cifrado = Buffer.concat([
    cipher.update(textoPuro, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return PREFIXO + Buffer.concat([iv, tag, cifrado]).toString('base64');
}

export function descriptografar(textoCifrado: string): string {
  if (!textoCifrado.startsWith(PREFIXO)) {
    throw new Error('Formato de texto cifrado desconhecido.');
  }
  const bruto = Buffer.from(textoCifrado.slice(PREFIXO.length), 'base64');
  const iv = bruto.subarray(0, 12);
  const tag = bruto.subarray(12, 28);
  const cifrado = bruto.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', chaveMestra(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString(
    'utf8'
  );
}
