# Sådan Genereres PrintStream Licensnøgler

## Licensnøgle Format
Formatet for en licensnøgle er: `XXXX-YYYY-ZZZZ-WWWW`

Hvor:
- `XXXX` = Hash af kundeID (4 tegn)
- `YYYY` = Krypteret antal dage (op til 8 tegn)
- `ZZZZ-WWWW` = Validerings checksum (8 tegn total)

## Generering af Dele

### 1. Kunde Hash (XXXX)
- Input: KundeID (string)
- Process:
  1. Konverter hver karakter til ASCII værdi
  2. Brug rolling hash algoritme: `hash = ((hash << 5) - hash) + char`
  3. Tag absolut værdi og konverter til hex
  4. Tag de første 4 tegn
- Output: 4 tegn hex string

### 2. Dage Kryptering (YYYY)
- Input: Antal dage (1-3650)
- Process:
  1. Multiplicer dage med 7919 (primtal)
  2. Konverter til hex
  3. Pad med nuller til 8 tegn
- Output: Op til 8 tegn hex string

### 3. Checksum (ZZZZ-WWWW)
- Input: KundeHash + KrypteretDage
- Process:
  1. Konkatenér input med "PrintStream-Secret-Key"
  2. Brug samme hash algoritme som for kundeID
  3. Tag de første 8 tegn af resultatet
- Output: 8 tegn hex string (delt i 4-4)

## Validering
Ved validering tjekkes:
1. Korrekt format (4 dele adskilt af bindestreger)
2. Hver del er valid hex
3. Checksum matcher
4. Dekrypteret antal dage er mellem 1-3650

## Begrænsninger
- Maksimum 10 års licens (3650 dage)
- Licensnøgler er case-insensitive
- Mellemrum trimmes automatisk

## Eksempel på Brug
```python
# Pseudokode for licensgenerering
def generate_license(customer_id: str, days: int) -> str:
    if not (1 <= days <= 3650):
        raise ValueError("Days must be between 1 and 3650")
        
    customer_hash = hash_customer_id(customer_id)[:4]
    days_encoded = encode_days(days)
    checksum = generate_checksum(customer_hash + days_encoded)
    
    return f"{customer_hash}-{days_encoded}-{checksum[:4]}-{checksum[4:]}"
```

## Sikkerhedsovervejelser
- Primtallet 7919 bruges som krypteringsnøgle for dage
- Checksummen inkluderer en hemmelig nøgle
- Kundens ID er hashet for at skjule den oprindelige værdi
- Systemet er designet til offline validering

## Database Integration
- Brugte licenser gemmes i `used_licenses` tabellen
- Hver installation har et unikt `installation_id`
- Systemet holder styr på brugte licenser for at forhindre genbrug

## Særlige Noter
- Licensnøgler kan ikke genbruges
- Ved ny version af softwaren:
  - Prøvelicenser nulstilles til 30 dage
  - Fulde licenser med mindre end 30 dage tilbage forlænges 