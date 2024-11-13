# Changelog

## [0.2.7] - 2024-11-13

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