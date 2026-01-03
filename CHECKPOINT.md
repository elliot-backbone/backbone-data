# Backbone CRM V8 - Stable Checkpoint

**Date:** 2026-01-03
**Version:** V8.1-STABLE-20260103-NAV
**Status:** Stable Rollback Point
**Previous:** V8.0-STABLE-20260103

## Checkpoint Summary

This checkpoint represents a stable state with navigation restructuring completed:

### Core Architecture
- 7-layer computation architecture implemented (L0-L6)
- Frozen North Stars principles enforced in codebase
- React + Vite + Supabase stack fully operational
- Window Manager system for multi-view navigation

### Navigation System
- Left vertical navigation restructured for Portfolio-first access
- Portfolio section shows Health/Priorities grid by default
- Companies, Goals, Rounds as direct children of Portfolio
- Deals nested under Rounds (proper hierarchy)
- Top horizontal navigation with vertical parent-child structure
- Consistent design language across both navigation systems
- Active state management and view routing

### Data Layer
- Supabase database with RLS policies
- Core entity tables: portfolioCompanies, masterInvestors, companyInvestors, talent, employees
- Priority resolutions tracking
- Migration system with explainability timestamps

### UI Components
- Dashboard with dual navigation
- Company, Firm, Person, Deal, Round detail views
- Portfolio overview and health visualization
- Priority queue and QA violation tracking
- Admin panels for analysis, generation, import/export

### Design System
- Consistent typography and spacing (8px grid)
- Unified color system with purple accent
- Hover states and transitions throughout
- Responsive layouts with proper hierarchy

## Build Status
✓ Production build successful (vite build)
✓ No compilation errors
✓ All assets bundled correctly

## Changes in This Version (V8.1-NAV)
- Portfolio section now primary view (Health/Priorities grid)
- Renamed view states: 'companies' → 'portfolio-overview', added 'companies-list'
- Deals moved under Rounds (proper parent-child hierarchy)
- Removed "Health" label in favor of "Companies" for clarity
- Updated typeMap in Dashboard.jsx for proper back navigation

## Known State
- Data flow: Raw inputs → Derivations → Display
- NoStoredDerivs principle maintained
- All navigation routes functional
- Admin panels integrated
- Build status: Clean compilation, no errors

## Rollback Instructions

To restore to this checkpoint:
1. Reference commit/state: V8.1-STABLE-20260103-NAV
2. All files in working state
3. Database migrations applied through 20260103002425
4. npm dependencies installed and locked
5. Key files modified: Dashboard.jsx (navigation structure)

To rollback to previous version:
- Reference: V8.0-STABLE-20260103
- Restore Dashboard.jsx navigation to use 'companies' instead of 'portfolio-overview'

## Next Development Areas
- Complete missing L1-L5 derivation layers
- Build goal management UI
- Implement portfolio-level aggregation views
- Connect external data sources (Google Sheets)
- Add predictive analytics capabilities
