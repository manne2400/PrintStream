// Kopier alle funktioner fra src/utils/license.ts
export const generateLicenseKey = (days: number, customerId: string): string => {
  const customerHash = hashString(customerId).slice(0, 4);
  const daysEncoded = encodeDays(days);
  const checksum = generateChecksum(customerHash + daysEncoded);
  
  return `${customerHash}-${daysEncoded}-${checksum.slice(0, 4)}-${checksum.slice(4, 8)}`;
};

const hashString = (str: string): string => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    h1 = Math.imul(h1 ^ byte, 2654435761);
    h2 = Math.imul(h2 ^ byte, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  
  return (h1 >>> 0).toString(16).slice(-8).padStart(8, '0');
};

const encodeDays = (days: number): string => {
  return (days * 7919).toString(16).padStart(8, '0');
};

const generateChecksum = (str: string): string => {
  return hashString(str + 'PrintStream-Secret-Key');
}; 