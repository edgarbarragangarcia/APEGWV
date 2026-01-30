
export const CARRIERS = [
    { name: 'Servientrega', pattern: /(servientrega|[0-9]{10,13})/i },
    { name: 'Coordinadora', pattern: /(coordinadora|[0-9]{11,15})/i },
    { name: 'Interrapidisimo', pattern: /(interrapidisimo|[0-9]{10,12})/i },
    { name: 'Envia', pattern: /(envia|[0-9]{9,12})/i },
    { name: 'TCC', pattern: /(tcc|[0-9]{10,12})/i },
    { name: 'FedEx', pattern: /(fedex|[0-9]{12,15})/i },
    { name: 'DHL', pattern: /(dhl|[0-9]{10})/i }
];

export const analyzeOCRText = (text: string) => {
    let extractedProvider = '';
    let bestMatch = '';

    // 1. Precise Carrier Search: Look for the carrier name first
    for (const carrier of CARRIERS) {
        if (text.toLowerCase().includes(carrier.name.toLowerCase())) {
            extractedProvider = carrier.name;
            break;
        }
    }

    // 2. Extract potential numbers (Alphanumeric, 8-22 chars)
    // Clean spaces and dashes which are common OCR artifacts
    const cleanedText = text.replace(/[\-|\s]/g, '');
    const potentialNumbers = cleanedText.match(/[A-Z0-9]{8,22}/g) || [];

    if (potentialNumbers.length > 0) {
        // Priority 1: If we have a carrier, try to find a number that matches its specific pattern
        if (extractedProvider) {
            const carrier = CARRIERS.find(c => c.name === extractedProvider);
            if (carrier) {
                const match = potentialNumbers.find(n => carrier.pattern.test(n));
                if (match) {
                    bestMatch = match;
                }
            }
        }

        // Priority 2: Take the most likely candidate (longest one that has digits)
        if (!bestMatch) {
            const validNumbers = potentialNumbers
                .filter(n => /[0-9]{6,}/.test(n)) // Must have a decent number of digits to avoid random words
                .sort((a, b) => b.length - a.length);

            if (validNumbers.length > 0) {
                bestMatch = validNumbers[0];
            }
        }
    }

    return { bestMatch, extractedProvider };
};
