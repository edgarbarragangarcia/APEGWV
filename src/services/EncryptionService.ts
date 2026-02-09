
// In a production app, the key should be derived from a password or stored in a secure vault
// For this implementation, we'll use a consistent key for the user session or derive it from the user ID
async function getEncryptionKey(userId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(`apeg-secure-${userId}`);

    // Hash the userId to get a consistent 256-bit key
    const hash = await crypto.subtle.digest('SHA-256', keyData);

    return await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(text: string, userId: string): Promise<string> {
    if (!text) return '';
    try {
        const key = await getEncryptionKey(userId);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encodedText = encoder.encode(text);

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encodedText
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Convert to Base64 for storage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

export async function decrypt(encryptedBase64: string, userId: string): Promise<string> {
    if (!encryptedBase64) return '';
    try {
        const key = await getEncryptionKey(userId);
        const combined = new Uint8Array(
            atob(encryptedBase64).split('').map(char => char.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        return '********'; // Return masked data on failure
    }
}
