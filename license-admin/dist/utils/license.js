"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLicenseKey = void 0;
// Kopier alle funktioner fra src/utils/license.ts
const generateLicenseKey = (days, customerId) => {
    const customerHash = hashString(customerId).slice(0, 4);
    const daysEncoded = encodeDays(days);
    const checksum = generateChecksum(customerHash + daysEncoded);
    return `${customerHash}-${daysEncoded}-${checksum.slice(0, 4)}-${checksum.slice(4, 8)}`;
};
exports.generateLicenseKey = generateLicenseKey;
const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
};
const encodeDays = (days) => {
    return (days * 7919).toString(16).padStart(4, '0');
};
const generateChecksum = (str) => {
    return hashString(str + 'PrintStream-Secret-Key');
};
