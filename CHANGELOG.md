# Changelog

## [0.2.6] - 2024-03-08

### Added
- Dark mode support across all pages
- Dark mode toggle in Settings
- Consistent styling with stats-card variant
- Improved visual hierarchy in dark mode
- Improved contrast and readability
- Automatic creation of used_licenses table in database
- License key tracking system implementation
- Database backup and restore functionality
- Auto-backup feature on startup
- Roll weight and number of rolls input in Filament creation
- Custom currency input option
- Timestamp for auto-backups
- Hours and minutes input for project time fields

### Changed
- Updated theme configuration for better dark mode support
- Improved layout consistency across all pages
- Enhanced table and card styling in dark mode
- Unified color scheme throughout the application
- Updated Box components to use stats-card variant
- Improved modal contrast in dark mode
- Improved form input visibility in dark mode
- Consistent text colors across the application
- Enhanced currency display formatting
- Changed default currency to EUR
- Reorganized Settings page layout into two columns
- Updated license system to extend from current expiry date

### Fixed
- Fixed background color inconsistencies
- Improved modal contrast in dark mode
- Improved form input visibility in dark mode
- Consistent text colors across the application
- Fixed dark mode styling for tables
- Fixed dark mode styling for cards
- Fixed dark mode styling for inputs and text areas
- Fixed used_licenses table creation in database
- Fixed license key validation and tracking
- Fixed currency display in project creation modal
- Fixed backup file naming with timestamps

### Technical
- Added stats-card variant to theme configuration
- Implemented useColorModeValue hook for dynamic colors
- Updated all pages to use the new theme structure
- Improved TypeScript type definitions
- Added database migration for used_licenses table
- Enhanced license key validation system
- Added backup and restore functionality
- Implemented auto-backup system
- Added timestamp to backup filenames