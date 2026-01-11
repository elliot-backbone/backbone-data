# BACKBONE V8 - INTEGRATION STATE

**Status:** 2026-01-11 | Before/After Analysis | Decision Gate

---

## CONDENSED STATE

**1. Current State (BEFORE)**
- Working monolithic computation: `/src/lib/derivations.js` (1,106 lines)
- Full L0→L1→L2→L3→L4→L5→L6 pipeline functional
- 12 UI components (Dashboard, PriorityQueue, PortfolioOverview, *Detail, *List)
- DB: 7 tables (firms, people, companies, rounds, goals, deals, priority_resolutions) with RLS
- Supabase integration via `loadAllData()` → `computeAllDerivations()` → UI
- Issues: 12/17+ conditions | Templates: 12/40+ | Tests: 0 | DAG: none | Modular: ❌

**2. Handover Package (AFTER)**
- Modular architecture: 12+ files (PriorityCompiler, trajectories, healthScoring, issueDetection, impactCalculator, dominanceRules, dependencyGraph, goalMemory, etc.)
- Test suite: 10 test files, 41/41 passing
- Enhanced algorithms: 25+ L1 derivations, 17+ issue conditions, 40+ resolution templates
- APIs: Class-based async `PriorityCompiler`, DAG enforcement, goal memory system, explainability metadata
- Not integrated: UI components need adapter layer

**3. North Stars Compliance**

| NS | BEFORE | AFTER |
|---|---|---|
| NoStoredDerivs | ✅ | ✅ Enhanced |
| Health=state | ✅ | ✅ Domain logic |
| Risk→Goal | ⚠️ Partial | ✅ Full |
| Urgency→Risk | ✅ | ✅ Enhanced |
| Portfolio=VIEW | ✅ | ✅ |
| DAG | ❌ | ✅ |
| Modularise | ❌ Monolith | ✅ |
| Delete>Add | ✅ | ⚠️ More features |

**4. Integration Plan**
- **Phase 1** (8h): Create `/src/lib/derivations-v2/`, adapter layer, feature flag, validate build
- **Phase 2** (10h): Wire to Dashboard, parallel validation (v1 vs v2), regression test
- **Phase 3** (8h): Add goal memory, expand issues to 17+, port templates to 40+, explainability UI
- **Phase 4** (4h): Remove old engine, optimize, port tests, document

**5. Critical Questions (BLOCKING)**
1. Integration approach: (A) Big-bang replace | (B) Parallel w/flag | (C) Incremental module-by-module?
2. API style: Keep functional or adopt class-based?
3. Must-have features: Which from [DAG, goalMemory, dominance, explainability]?
4. Backward compat: Required or accept breaking changes?
5. Sample data: Wait for user's generator or use current?
6. DecisionView.jsx: Use in UI or ignore?
7. UX: Preserve exact or allow improvements?
8. Tests: Port all or selective?
9. Portfolio size: <20 | 20-50 | 50+ companies?
10. Timeline: 4 weeks acceptable or faster?

**6. Deliverables Present**
- INTEGRATION_ANALYSIS.md (this file)
- HANDOVER.txt (previous session state)
- CHECKPOINT.md (version tracking)
- SETUP-INSTRUCTIONS.txt (environment)
- Handover package (separate zip, not in project)

**7. API Mapping**

**Current (Functional):**
```javascript
import { computeAllDerivations, detectIssues, calculateHealth } from './lib/derivations';
const result = computeAllDerivations(rawData, resolvedPriorities);
const { l0, l1, l2, l3, l4, l5, l6 } = result;
```

**Handover (Class-based):**
```javascript
import { PriorityCompiler } from './lib/PriorityCompiler';
const compiler = new PriorityCompiler({ rawData, resolvedPriorities, computationVersion: 'v8.2' });
const result = await compiler.compile();
const { layers, priorities, metadata } = result;
```

**Proposed Adapter:**
```javascript
// /src/lib/derivations-v2/adapter.js
export function computeAllDerivations(rawData, resolvedPriorities) {
  const compiler = new PriorityCompiler({ rawData, resolvedPriorities, version: 'v8.2' });
  const result = compiler.compileSync();
  return { l0: result.layers.raw, l1: result.layers.derivations, l2: result.layers.trajectories,
           l3: result.layers.health, l4: result.layers.issues, l5: result.layers.priorities,
           l6: result.layers.output };
}
```

**8. Documentation Paths**
- `/tmp/cc-agent/62117328/project/INTEGRATION_ANALYSIS.md` (this file)
- `/tmp/cc-agent/62117328/project/HANDOVER.txt` (session handover)
- `/tmp/cc-agent/62117328/project/CHECKPOINT.md` (version log)
- `/tmp/cc-agent/62117328/project/README.md` (project overview)
- `/tmp/cc-agent/62117328/project/SETUP-INSTRUCTIONS.txt` (environment setup)

---

## DECISION GATE

**Status:** ⏸️ BLOCKED - Awaiting user answers to 10 critical questions above

**Current Working State:** V8.1 - Monolithic but functional
**Target State:** V8.2 - Modular with enhanced capabilities
**Path Forward:** 4-phase integration (~30 hours over 4 weeks)

**Next Action:** User to answer questions 1-10, then proceed to Phase 1

---

**END CONDENSED ANALYSIS**
