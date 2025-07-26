// NOTE: Much of what's here is derived from various ChatGPT responses:
//
//  - https://gist.github.com/jeremyckahn/cbb6107e7de6c83b620960a19266055e
//  - https://gist.github.com/jeremyckahn/c49ca17a849ecf35c5f957ffde956cf4

export enum AllowedKeyType {
  PUBLIC,
  PRIVATE,
}

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const binary = String.fromCharCode(...new Uint8Array(buffer))
  return btoa(binary)
}

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes.buffer
}

const algorithmName = 'RSA-OAEP'

const algorithmHash = 'SHA-256'

export class EncryptionService {
  cryptoKeyStub: CryptoKey = {
    algorithm: { name: 'STUB-ALGORITHM' },
    extractable: false,
    type: 'private',
    usages: [],
  }

  // TODO: Make this configurable
  generateKeyPair = async (): Promise<CryptoKeyPair> => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: algorithmName,
        hash: algorithmHash,
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      },
      true,
      ['encrypt', 'decrypt']
    )

    return keyPair
  }

  encodePassword = async (roomId: string, password: string) => {
    const data = new TextEncoder().encode(`${roomId}_${password}`)
    const digest = await window.crypto.subtle.digest('SHA-256', data)
    const bytes = new Uint8Array(digest)
    const encodedPassword = window.btoa(String.fromCharCode(...bytes))

    return encodedPassword
  }

  stringifyCryptoKey = async (cryptoKey: CryptoKey) => {
    const exportedKey = await window.crypto.subtle.exportKey(
      cryptoKey.type === 'public' ? 'spki' : 'pkcs8',
      cryptoKey
    )

    const exportedKeyAsString = arrayBufferToBase64(exportedKey)

    return exportedKeyAsString
  }

  parseCryptoKeyString = async (keyString: string, type: AllowedKeyType) => {
    const importedKey = await window.crypto.subtle.importKey(
      type === AllowedKeyType.PUBLIC ? 'spki' : 'pkcs8',
      base64ToArrayBuffer(keyString),
      {
        name: algorithmName,
        hash: algorithmHash,
      },
      true,
      type === AllowedKeyType.PUBLIC ? ['encrypt'] : ['decrypt']
    )

    return importedKey
  }

  encryptString = async (publicKey: CryptoKey, plaintext: string) => {
    const encodedText = new TextEncoder().encode(plaintext)
    const encryptedData = await crypto.subtle.encrypt(
      algorithmName,
      publicKey,
      encodedText
    )

    return encryptedData
  }

  decryptString = async (privateKey: CryptoKey, encryptedData: ArrayBuffer) => {
    const decryptedArrayBuffer = await crypto.subtle.decrypt(
      algorithmName,
      privateKey,
      encryptedData
    )

    const decryptedString = new TextDecoder().decode(decryptedArrayBuffer)

    return decryptedString
  }

  // === SINIFIN SONUNA EKLENEN YENİ FONKSİYONLAR ===

  // Paroladan güvenli bir şifreleme anahtarı türetir
  private deriveKeyFromPassword = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  // Veriyi parola ile şifreler
  encryptWithPassword = async (data: string, password: string): Promise<string> => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKeyFromPassword(password, salt);
    
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      new TextEncoder().encode(data)
    );

    const encryptedBytes = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedBytes, salt.length + iv.length);

    return arrayBufferToBase64(combined.buffer); // arrayBufferToBase64 zaten dosyanızda mevcut
  };

  // Parola ile şifrelenmiş veriyi çözer
  decryptWithPassword = async (encryptedData: string, password: string): Promise<string> => {
    const combined = base64ToArrayBuffer(encryptedData); // base64ToArrayBuffer zaten dosyanızda mevcut
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedContent = combined.slice(28);

    const key = await this.deriveKeyFromPassword(password, new Uint8Array(salt));
    
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      encryptedContent
    );

    return new TextDecoder().decode(decryptedContent);
  };
}

export const encryption = new EncryptionService()
