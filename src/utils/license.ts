// Funktion til at generere en licensnøgle
export const generateLicenseKey = (days: number, customerId: string): string => {
  // Format: XXXX-YYYY-ZZZZ-WWWW
  // Hvor:
  // XXXX = Hash af kundeID
  // YYYY = Antal dage krypteret
  // ZZZZ-WWWW = Validerings checksum
  
  const customerHash = hashString(customerId).slice(0, 4);
  const daysEncoded = encodeDays(days);
  const checksum = generateChecksum(customerHash + daysEncoded);
  
  return `${customerHash}-${daysEncoded}-${checksum.slice(0, 4)}-${checksum.slice(4, 8)}`;
};

// Funktion til at validere en licensnøgle
export const validateLicenseKey = (key: string): { 
  isValid: boolean;
  days?: number;
} => {
  try {
    const parts = key.split('-');
    if (parts.length !== 4) return { isValid: false };
    
    const [customerHash, daysEncoded, checksum1, checksum2] = parts;
    const checksum = checksum1 + checksum2;
    
    // Valider checksum
    const expectedChecksum = generateChecksum(customerHash + daysEncoded);
    if (checksum !== expectedChecksum) return { isValid: false };
    
    // Dekrypter antal dage
    const days = decodeDays(daysEncoded);
    if (!days || days <= 0) return { isValid: false };
    
    return { isValid: true, days };
  } catch {
    return { isValid: false };
  }
};

// Hjælpefunktioner
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

const encodeDays = (days: number): string => {
  // Simpel kryptering af dage
  return (days * 7919).toString(16).padStart(4, '0');
};

const decodeDays = (encoded: string): number => {
  // Dekrypter dage
  return Math.floor(parseInt(encoded, 16) / 7919);
};

const generateChecksum = (str: string): string => {
  return hashString(str + 'PrintStream-Secret-Key');
}; 