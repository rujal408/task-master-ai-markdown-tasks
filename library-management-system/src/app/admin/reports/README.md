# Library Management System - Reporting System

## Overview

The reporting system provides comprehensive inventory and circulation statistics for library administrators and librarians. It offers:

- **Inventory Reports**: Track book status, availability, and collection statistics
- **Circulation Reports**: Analyze checkout patterns and popular books
- **Maintenance Reports**: Track lost, damaged, and books under maintenance
- **Export Functionality**: Download reports in CSV format for further analysis

## API Endpoints

### Inventory Reports

```
GET /api/reports/inventory
```

Returns general inventory statistics including:
- Total books by status
- Books by category
- New acquisitions
- Lost/damaged books

Query parameters:
- `format`: `json` (default) or `csv`
- `timeframe`: `day`, `week`, `month` (default), `year`, or `all`
- `category`: Optional filter by specific category
- `status`: Optional filter by specific book status

### Circulation Reports

```
GET /api/reports/inventory/circulation
```

Returns circulation statistics including:
- Total transactions
- Transactions by status
- Most checked out books
- Average checkout duration
- Category breakdown

Query parameters:
- `format`: `json` (default) or `csv`
- `timeframe`: `day`, `week`, `month` (default), `year`, or `all`
- `category`: Optional filter by specific category

### Maintenance Reports

```
GET /api/reports/inventory/maintenance
```

Returns statistics about books needing attention:
- Books in maintenance statuses (lost, damaged, under maintenance, discarded)
- Status breakdowns
- Category analysis
- Detailed book list with transaction history

Query parameters:
- `format`: `json` (default) or `csv`
- `timeframe`: `day`, `week`, `month` (default), `year`, or `all`
- `status`: Optional filter by specific maintenance status

## UI Components

The reporting system includes several React components:

- **Reports Dashboard**: Main navigation page for all report types
- **Inventory Summary**: Visual representation of inventory data with charts
- **Circulation Summary**: Analysis of checkout patterns and popular books
- **Maintenance Summary**: Details on books needing attention

## Data Visualization

Reports use Chart.js for data visualization, including:
- Pie charts for status distributions
- Bar charts for category breakdowns
- Tables for detailed data analysis

## Export Functionality

All reports can be exported in CSV format for further analysis in spreadsheet applications or other data processing tools.

## Access Control

The reporting system is accessible only to users with ADMIN or LIBRARIAN roles, ensuring that sensitive library data is properly protected.

## Usage Examples

### Generating an Inventory Report

```typescript
// Example: Get inventory report for the last 30 days
const response = await fetch('/api/reports/inventory?timeframe=month');
const data = await response.json();
```

### Exporting a Circulation Report

```typescript
// Example: Export CSV of circulation data for a specific category
window.location.href = '/api/reports/inventory/circulation?format=csv&category=Fiction';
```

### Filtering Maintenance Reports

```typescript
// Example: Get only lost books
const response = await fetch('/api/reports/inventory/maintenance?status=LOST');
const data = await response.json();
```

## Best Practices

1. Use the timeframe filter to focus on specific periods
2. Filter by category to analyze specific sections of your collection
3. Export to CSV for further analysis in spreadsheet applications
4. Check maintenance reports regularly to identify books needing attention
5. Use circulation reports to identify popular books and inform acquisition decisions
