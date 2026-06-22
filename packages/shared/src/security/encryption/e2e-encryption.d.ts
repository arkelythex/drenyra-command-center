export interface EncryptedData {
    cipher: string;
    iv: string;
    tag: string;
    salt: string;
    version: string;
}
export interface UserKeyPair {
    userId: string;
    publicKey?: string;
    encryptedPrivateKey: string;
}
export declare function encryptWithPassphrase(plaintext: string, passphrase: string): EncryptedData;
export declare function decryptWithPassphrase(encrypted: EncryptedData, passphrase: string): string;
export declare function encryptFiscalData(data: Record<string, unknown>, userPassphrase: string): EncryptedData;
export declare function decryptFiscalData<T>(encrypted: EncryptedData, userPassphrase: string): T;
//# sourceMappingURL=e2e-encryption.d.ts.map