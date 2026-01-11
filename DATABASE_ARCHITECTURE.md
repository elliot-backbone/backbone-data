# Backbone Database Architecture
## Version: 01/11/2026_12:00:00

## Overview
This document describes the complete database architecture for the Backbone portfolio management system, designed to support the 7-layer computation model (L0-L6) while strictly adhering to North Stars principles.

## Core Principles

### North Stars Compliance
- **NoStoredDerivs**: All health scores, priority scores, and computed metrics exist ONLY in application memory, never persisted
- **Health=state**: Database stores internal entity conditions, not prescriptive assessments
- **Risk→Goal**: All risk detection maps to specific goal contexts
- **Urgency→Risk**: Priority calculation driven by gap-oriented scoring
- **Portfolio=VIEW**: Portfolio aggregations are presentation layer only
- **DAG**: Explicit directed acyclic graph dependencies in computation
- **Modularise**: Physical separation of concerns across tables
- **Delete>Add**: Ruthless elimination over feature expansion

## Database Schema

### Core Entity Tables

#### `companies`
Portfolio companies and pipeline prospects
- **Raw Fields (L0)**:
  - `id`, `name`, `is_portfolio`, `founder_id`
  - `founded_at`, `country`
  - `cash_on_hand`, `monthly_burn`, `mrr`
  - `revenue_growth_rate`, `gross_margin`, `cac_payback`
  - `stage`, `sector`, `employee_count`
  - `website`, `description`, `thesis`, `tags[]`
- **Timestamp Fields**:
  - `last_material_update_at`
  - `cash_on_hand_updated_at`
  - `monthly_burn_updated_at`
  - `mrr_updated_at`
  - `created_at`, `updated_at`
- **Computed Fields (NEVER STORED)**:
  - arr, runway, burnMultiple, health scores, trajectories

#### `rounds`
Fundraising rounds for companies
- **Raw Fields (L0)**:
  - `id`, `company_id`, `round_type`
  - `target_amount`, `raised_amount`, `status`
  - `started_at`, `target_close_date`, `actual_close_date`
  - `lead_investor_id`
  - `notes`, `deck_url`, `data_room_url`
- **Timestamp Fields**:
  - `created_at`, `updated_at`
- **Computed Fields (NEVER STORED)**:
  - coverage, daysOpen, daysToClose, fundraisingVelocity, health scores

#### `goals`
Company-specific objectives and milestones
- **Raw Fields (L0)**:
  - `id`, `company_id`, `goal_type`, `title`
  - `target_value`, `current_value`
  - `start_date`, `target_date`
  - `status`, `owner_id`
- **Timestamp Fields**:
  - `last_updated_at`
  - `current_value_updated_at`
  - `created_at`, `updated_at`
- **Computed Fields (NEVER STORED)**:
  - progress, progressVelocity, isOnTrack, projectedCompletion, health scores

#### `deals`
Individual investor relationships within fundraising rounds
- **Raw Fields (L0)**:
  - `id`, `round_id`, `firm_id`, `person_id`
  - `deal_stage`, `expected_amount`
  - `last_contact_date`, `introduced_by_id`
  - `notes`, `next_steps`
- **Timestamp Fields**:
  - `stage_entry_date`
  - `created_at`, `updated_at`

#### `people`
Investors, operators, advisors, founders
- **Raw Fields (L0)**:
  - `id`, `first_name`, `last_name`, `email`
  - `role`, `firm_id`, `title`
  - `linkedin_url`, `twitter_url`, `tags[]`
- **Timestamp Fields**:
  - `last_contacted_at`
  - `created_at`, `updated_at`

#### `firms`
Investment firms and corporate VCs
- **Raw Fields (L0)**:
  - `id`, `name`, `firm_type`
  - `typical_check_min`, `typical_check_max`
  - `focus_areas[]`, `website`, `fund_size`
- **Timestamp Fields**:
  - `created_at`, `updated_at`

### Relationship & Interaction Tables

#### `relationships`
Connections between entities (people, firms, companies)
- **Fields**:
  - `id`, `source_id`, `source_type`
  - `target_id`, `target_type`
  - `relationship_type`, `strength_indicator`
  - `last_interaction_at`, `notes`
  - `created_at`, `updated_at`

#### `interactions`
Log of all touchpoints and communications
- **Fields**:
  - `id`, `entity_id`, `entity_type`
  - `interaction_type`, `interaction_date`
  - `description`, `outcome`, `next_steps`
  - `created_by`, `created_at`

### System Tables

#### `priority_resolutions`
Tracks resolved priorities to prevent re-emission
- **Fields**:
  - `id`, `company_id`
  - `issue_category`, `issue_title`
  - `resolved_at`, `resolution_notes`
  - `created_at`

#### `priority_queue`
Ephemeral computed priorities (recalculated on demand)
- **Fields**:
  - `id`, `entity_id`, `entity_type`, `entity_name`
  - `category`, `severity`, `title`, `description`
  - `suggested_action`, `trigger_condition`
  - `urgency_score`, `impact_score`, `effort_score`, `priority_score`
  - `resolution_template`, `resolution_steps`, `dependencies`, `cascade_effect`
  - `computed_at`, `created_at`
- **NOTE**: This table is cleared and repopulated on each computation cycle

#### `system_config`
System-wide configuration and settings
- **Fields**:
  - `id`, `config_key`, `config_value` (jsonb)
  - `description`
  - `updated_at`, `created_at`

## 7-Layer Computation Architecture

### Layer 0 (L0): Raw Inputs
- **Storage**: All tables above
- **What**: Human-entered facts, timestamps, identifiers
- **Examples**: cash_on_hand, mrr, monthly_burn, last_contacted_at

### Layer 1 (L1): Pure Derivations
- **Storage**: NONE - computed in memory only
- **What**: Single-entity mathematical derivations
- **Examples**: runway, burnMultiple, coverage, progress

### Layer 2 (L2): Trajectories
- **Storage**: NONE - computed in memory only
- **What**: Time-based projections and trends
- **Examples**: runwayProjection, fundraisingMomentum, completionTrend

### Layer 3 (L3): State & Goal Risk
- **Storage**: NONE - computed in memory only
- **What**: Health scores describing internal entity condition
- **Examples**: capitalHealth, revenueHealth, overallHealth

### Layer 4 (L4): Issue Detection
- **Storage**: NONE - computed in memory only
- **What**: Gaps that block progress, filtered by resolutions
- **Examples**: "Runway at 2.3 months", "Round stalled at 25% coverage"

### Layer 5 (L5): Priority Calculation
- **Storage**: NONE - computed in memory only
- **What**: Scored, ranked, resolution-templated priorities
- **Examples**: priorityScore, resolutionSteps, cascadeEffect

### Layer 6 (L6): Priority Output
- **Storage**: `priority_queue` (ephemeral snapshot)
- **What**: Top 20 priorities, grouped views, summary stats
- **Purpose**: UI display only, cleared on next computation

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ L0: Raw Inputs (Database Tables)                            │
│ companies, rounds, goals, deals, people, firms              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ L1: Pure Derivations (Memory Only)                          │
│ runway, burnMultiple, coverage, progress, etc.              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ L2: Trajectories (Memory Only)                              │
│ runwayProjection, fundraisingMomentum, etc.                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ L3: Health (Memory Only)                                    │
│ capitalHealth, revenueHealth, overallHealth                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ L4: Issue Detection (Memory Only)                           │
│ Filtered by priority_resolutions table                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ L5: Priority Calculation (Memory Only)                      │
│ Scored, ranked, with resolution templates                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ L6: Priority Output                                         │
│ Ephemeral snapshot in priority_queue for UI display         │
└─────────────────────────────────────────────────────────────┘
```

## Indexes

Performance optimization for common queries:
- `idx_companies_portfolio` - Fast portfolio company filtering
- `idx_rounds_status` - Active round queries
- `idx_deals_stage` - Pipeline stage distribution
- `idx_goals_status` - Active goal tracking
- `idx_relationships_source/target` - Relationship graph traversal
- `idx_interactions_entity/date` - Recent interaction lookup
- `idx_priority_queue_score` - Top priority retrieval

## Security (RLS)

All tables have Row Level Security enabled with:
- **Anonymous (anon)**: Read-only access for demo/testing
- **Authenticated**: Full CRUD access
- **Production**: Should restrict anon access and implement user-scoped policies

## Migration History

1. `20260102215438_create_priority_resolutions.sql` - Initial priority tracking
2. `20260102222325_fix_priority_resolutions_rls.sql` - RLS fixes
3. `20260102231041_create_core_entities.sql` - Core entity tables
4. `20260103000345_allow_anon_access.sql` - Demo access setup
5. `20260103000407_allow_anon_priority_resolutions.sql` - Priority access
6. `20260103001402_remove_stored_derivations.sql` - North Stars compliance
7. `20260103002425_add_explainability_timestamps.sql` - Timestamp tracking
8. **`01_11_2026_12_00_00_comprehensive_schema.sql`** - Complete architecture ✅

## Key Decisions

### Why Not Store Computed Values?
1. **NoStoredDerivs Principle**: Prevents stale data and synchronization bugs
2. **Single Source of Truth**: Raw data is authoritative, derivations are reproducible
3. **Explainability**: Every computed value can be traced to raw inputs
4. **Simplicity**: No cache invalidation, no update cascades

### Why priority_queue Table Exists?
- **UI Performance**: Prevents re-computation on every page load
- **Ephemeral Nature**: Cleared and repopulated regularly
- **Debugging**: Snapshot of last computation for troubleshooting
- **NOT a cache**: Does not persist across sessions

### Timestamp Philosophy
- **Update Timestamps**: Track when raw data changed
- **Entity Timestamps**: last_material_update_at, last_contacted_at, etc.
- **Field-Level Timestamps**: cash_on_hand_updated_at for precise staleness detection
- **Computed Timestamps**: computed_at for cache invalidation only

## Future Considerations

### Potential Additions
- `communications` table for email/WhatsApp integration
- `documents` table for deck/memo storage
- `events` table for calendar integration
- `tags` normalization (currently text arrays)

### Scaling Considerations
- Partition `interactions` by date for high-volume logging
- Read replicas for heavy analytical queries
- Materialized views for portfolio aggregations (still ephemeral)

## Usage Examples

### Computing All Derivations
```javascript
import { computeAllDerivations } from './lib/derivations.js';
import { supabase } from './lib/supabase.js';

// Fetch L0 data
const { data: companies } = await supabase.from('companies').select('*');
const { data: rounds } = await supabase.from('rounds').select('*');
const { data: goals } = await supabase.from('goals').select('*');
const { data: resolvedPriorities } = await supabase.from('priority_resolutions').select('*');

// Compute all layers
const rawData = { companies, rounds, goals };
const result = computeAllDerivations(rawData, resolvedPriorities);

// Access computed layers
console.log(result.l6.topPriorities); // Top 20 priorities
console.log(result.l3.portfolioHealth); // Portfolio health
```

### Resolving a Priority
```javascript
await supabase.from('priority_resolutions').insert({
  company_id: 'uuid-here',
  issue_category: 'capital_sufficiency',
  issue_title: 'Runway at 2.3 months',
  resolution_notes: 'Secured $2M bridge from existing investor'
});
```

## Maintenance

### Regular Tasks
1. **Daily**: Clear priority_queue older than 24h
2. **Weekly**: Vacuum interactions table
3. **Monthly**: Analyze index usage and optimize
4. **Quarterly**: Review and archive completed goals/closed rounds

### Monitoring
- Watch for missing timestamps (indicates stale data)
- Monitor computation times (L0→L6 should be <2s for 100 companies)
- Track priority_resolutions growth (indicates resolution velocity)
