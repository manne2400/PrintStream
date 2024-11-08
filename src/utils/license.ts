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
    // Tilføj debug logging
    console.log('Starting license validation for key:', key);
    
    // Fjern eventuelle mellemrum og konverter til lowercase
    key = key.trim().toLowerCase();
    
    // Mere fleksibelt format check
    const parts = key.split('-');
    if (parts.length !== 4) {
      console.log('Invalid number of parts');
      return { isValid: false };
    }

    const [customerHash, daysEncoded, checksum1, checksum2] = parts;
    
    // Validér hver del individuelt
    if (customerHash.length !== 4 || 
        !customerHash.match(/^[0-9a-f]{4}$/)) {
      console.log('Invalid customer hash format');
      return { isValid: false };
    }

    // Tillad variabel længde for daysEncoded (op til 5 tegn)
    if (!daysEncoded.match(/^[0-9a-f]{1,5}$/)) {
      console.log('Invalid days format');
      return { isValid: false };
    }

    if (checksum1.length !== 4 || checksum2.length !== 4 ||
        !checksum1.match(/^[0-9a-f]{4}$/) || 
        !checksum2.match(/^[0-9a-f]{4}$/)) {
      console.log('Invalid checksum format');
      return { isValid: false };
    }

    const checksum = checksum1 + checksum2;
    
    // Validate checksum
    const expectedChecksum = generateChecksum(customerHash + daysEncoded);
    if (checksum !== expectedChecksum.slice(0, 8)) {
      console.log('Invalid checksum');
      return { isValid: false };
    }

    // Decode days
    const days = decodeDays(daysEncoded);
    if (days <= 0 || days > 3650) { // Max 10 years
      console.log('Invalid days:', days);
      return { isValid: false };
    }

    console.log('License validation successful. Days:', days);
    return { isValid: true, days };
  } catch (err) {
    console.error('Error in validateLicenseKey:', err);
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