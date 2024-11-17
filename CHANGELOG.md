# Changelog

## [0.3.1] - 2024-11-17
### Added
- Invoice logo functionality
  - Added logo upload in settings
  - Implemented logo display on invoices
  - Added logo preview in settings
- Improved invoice design
  - Enhanced layout and spacing
  - Added professional color scheme
  - Improved typography
  - Added better section separation
- English language support for invoices
  - Converted all invoice text to English
  - Updated labels and headers
  - Standardized business terminology

### Changed
- Updated invoice template with better styling
- Improved invoice preview modal
- Enhanced company information display on invoices
- Better handling of image loading in PDFs

### Fixed
- Fixed logo loading timing in PDF generation
- Fixed image display issues in preview
- Corrected alignment issues in invoice layout
- Fixed VAT ID display on invoices

### Technical
- Added proper image handling in PDF generation
- Improved async operations for PDF creation
- Enhanced error handling for file operations
- Updated database schema for logo storage



## [0.2.9] - 2024-11-11

### Added
- Added custom material types management
  - New database table for custom material types
  - UI for adding/removing custom material types
  - Support for both filament and resin custom types
- Added automatic resin detection for predefined resin types
- Added resin settings display for all resin materials

### Changed
- Removed "Other" option from material type selection
- Updated material type handling to include custom types
- Modified sales process to prevent double stock reduction
- Fixed project time calculation (removed unintended multiplication)

### Fixed
- Fixed issue with stock being reduced twice (at print and sale)
- Fixed incorrect time calculation in project creation
- Fixed resin type detection for predefined types
- Fixed material type selection and resin settings display

## [0.2.7] - 2024-11-10

### Added
- Added shipping cost column to database
- Added resin support to filament management
  - New resin types in filament selection
  - Resin-specific settings (exposure, lift settings, etc.)
  - Unit display changes between g/mL based on material type
- Added info button and modal for filament/resin details
- Added customer statistics to Reports page

### Changed
- Updated invoice handling on Dashboard
  - Now shows total amount per invoice instead of individual items
  - Improved sales overview with grouped data
- Modified unit display (g/mL) throughout the application based on material type
- Improved search functionality
  - Added search to Sales page
  - Added search to Print Inventory page
  - Unified search behavior across all pages

### Fixed
- Fixed payment status updates to affect all items under the same invoice number
- Fixed dashboard statistics calculations
- Fixed search functionality in Sales and Print Inventory pages
- Fixed unit display alignment in filament table
- Various minor UI improvements and bug fixes

### Technical
- Added new database columns for resin support
- Improved data grouping for sales statistics
- Updated database operations to handle resin properties