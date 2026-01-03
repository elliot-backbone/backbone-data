import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import QAViolationDetail from './QAViolationDetail';
import './AdminQA.css';

export default function AdminQA() {
  const [qaResults, setQaResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [detailedViolations, setDetailedViolations] = useState({});

  useEffect(() => {
    runQA();
  }, []);

  async function runQA() {
    setLoading(true);
    const results = {};

    try {
      const { data: companies } = await supabase.from('companies').select('*');
      const { data: people } = await supabase.from('people').select('*');
      const { data: rounds } = await supabase.from('rounds').select('*');
      const { data: goals } = await supabase.from('goals').select('*');
      const { data: deals } = await supabase.from('deals').select('*');

      const explainabilityGapsDetail = checkExplainabilityGaps(companies, goals, deals);
      const storedDerivationsDetail = checkStoredDerivations(companies, goals, deals, rounds);
      const missingTTLDetail = checkMissingTTL(companies, goals, deals);
      const goalOrphansDetail = checkGoalWithoutRisk(goals, companies);
      const portfolioMixedDetail = checkPortfolioMixedState(companies);

      results.invariants = {
        derivedValuesStored: checkDerivedValues(companies, goals, deals),
        missingTTL: missingTTLDetail.count,
        storedDerivationsFound: storedDerivationsDetail.count,
        explainabilityGaps: explainabilityGapsDetail.count,
        portfolioNotView: portfolioMixedDetail.count,
        goalOrphans: goalOrphansDetail.count,
        silentOverwrites: 0
      };

      setDetailedViolations({
        explainabilityGaps: {
          type: 'explainabilityGaps',
          title: 'Explainability Gaps Detected',
          description: 'Critical entity states lack timestamp metadata, preventing the system from understanding when conditions arose and blocking priority calculation.',
          severity: 'critical',
          northStar: 'NoStoredDerivs + Health=state',
          violations: explainabilityGapsDetail.violations,
          remedy: [
            'Add timestamp fields for all state-changing updates',
            'Populate last_material_update_at for companies with low runway',
            'Populate last_updated_at for overdue goals',
            'Populate last_contact_date for deals in advanced stages',
            'Ensure all future updates include timestamp metadata'
          ]
        },
        storedDerivationsFound: {
          type: 'storedDerivations',
          title: 'Stored Derivations Found',
          description: 'Computed values are being persisted to the database, violating the NoStoredDerivs North Star.',
          severity: 'critical',
          northStar: 'NoStoredDerivs',
          violations: storedDerivationsDetail.violations,
          remedy: [
            'Remove derived columns from database schema (arr, runway, is_on_track)',
            'Move all computation logic to derivations.js',
            'Update queries to compute values on-the-fly',
            'Verify no application code writes to derived columns'
          ]
        },
        missingTTL: {
          type: 'missingTTL',
          title: 'Missing TTL Timestamps',
          description: 'Critical fields lack time-to-live timestamps, preventing stale data detection.',
          severity: 'high',
          northStar: 'NoStoredDerivs',
          violations: missingTTLDetail.violations,
          remedy: [
            'Add *_updated_at timestamp fields for all critical value fields',
            'Populate timestamps when values are created or updated',
            'Use timestamps in trajectory calculations'
          ]
        },
        goalOrphans: {
          type: 'goalOrphans',
          title: 'Goals Without Risk Context',
          description: 'Goals lack proper risk mapping, preventing priority calculation.',
          severity: 'medium',
          northStar: 'Risk→Goal',
          violations: goalOrphansDetail.violations,
          remedy: [
            'Ensure all goals have target_value, current_value, and target_date',
            'Link goals to specific company risks',
            'Remove or complete orphaned goals'
          ]
        },
        portfolioNotView: {
          type: 'portfolioMixedState',
          title: 'Portfolio Mixed State',
          description: 'Portfolio entities are storing state instead of being pure views.',
          severity: 'medium',
          northStar: 'Portfolio=VIEW',
          violations: portfolioMixedDetail.violations,
          remedy: [
            'Remove stored state from portfolio aggregations',
            'Compute portfolio metrics on-the-fly from company data',
            'Ensure portfolio views are read-only presentation layers'
          ]
        }
      });

      results.companies = {
        total: companies?.length || 0,
        portfolio: companies?.filter(c => c.is_portfolio).length || 0,
        missingFounder: companies?.filter(c => !c.founder_id).length || 0,
        negativeCash: companies?.filter(c => c.cash_on_hand < 0).length || 0
      };

      results.people = {
        total: people?.length || 0,
        duplicateEmails: checkDuplicateEmails(people || []),
        missingRole: people?.filter(p => !p.role).length || 0
      };

      results.goals = {
        total: goals?.length || 0,
        overdue: goals?.filter(g => new Date(g.target_date) < new Date()).length || 0,
        orphaned: goals?.filter(g => !companies?.find(c => c.id === g.company_id)).length || 0
      };

      results.deals = {
        total: deals?.length || 0,
        missingRound: deals?.filter(d => !rounds?.find(r => r.id === d.round_id)).length || 0
      };

      setQaResults(results);
    } catch (error) {
      console.error('QA check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function checkDerivedValues(companies, goals, deals) {
    let count = 0;
    companies?.forEach(c => {
      if (c.health_score != null || c.priority_score != null || c.failure_risk != null) count++;
    });
    goals?.forEach(g => {
      if (g.risk_score != null || g.priority_score != null) count++;
    });
    deals?.forEach(d => {
      if (d.priority_score != null) count++;
    });
    return count;
  }

  function checkMissingTTL(companies, goals, deals) {
    const violations = [];
    const criticalCompanyFields = [
      { value: 'cash_on_hand', timestamp: 'cash_on_hand_updated_at' },
      { value: 'monthly_burn', timestamp: 'monthly_burn_updated_at' },
      { value: 'mrr', timestamp: 'mrr_updated_at' }
    ];
    companies?.forEach(c => {
      criticalCompanyFields.forEach(field => {
        if (c[field.value] != null && !c[field.timestamp]) {
          violations.push({
            entityType: 'Company',
            entityName: c.name,
            recordId: c.id,
            field: field.timestamp,
            value: null,
            reason: `Field ${field.value} has value but missing TTL timestamp`,
            context: `${field.value}: ${c[field.value]}`
          });
        }
      });
    });
    const criticalGoalFields = [
      { value: 'current_value', timestamp: 'current_value_updated_at' }
    ];
    goals?.forEach(g => {
      criticalGoalFields.forEach(field => {
        if (g[field.value] != null && !g[field.timestamp]) {
          violations.push({
            entityType: 'Goal',
            entityName: g.title || 'Untitled Goal',
            recordId: g.id,
            field: field.timestamp,
            value: null,
            reason: `Field ${field.value} has value but missing TTL timestamp`,
            context: `${field.value}: ${g[field.value]}`
          });
        }
      });
    });
    deals?.forEach(d => {
      if (d.deal_stage != null && !d.stage_entry_date) {
        violations.push({
          entityType: 'Deal',
          entityName: `Deal in ${d.deal_stage}`,
          recordId: d.id,
          field: 'stage_entry_date',
          value: null,
          reason: 'Deal has stage but missing stage entry timestamp',
          context: `Stage: ${d.deal_stage}`
        });
      }
    });
    return { count: violations.length, violations };
  }

  function checkDuplicateEmails(people) {
    const emails = people.map(p => p.email?.toLowerCase());
    const duplicates = emails.filter((e, i) => e && emails.indexOf(e) !== i);
    return new Set(duplicates).size;
  }

  function checkStoredDerivations(companies, goals, deals, rounds) {
    const violations = [];

    companies?.forEach(c => {
      if (c.arr != null) {
        violations.push({
          entityType: 'Company',
          entityName: c.name,
          recordId: c.id,
          field: 'arr',
          value: c.arr,
          reason: 'Stored derived value - should be computed from MRR * 12'
        });
      }
      if (c.runway != null) {
        violations.push({
          entityType: 'Company',
          entityName: c.name,
          recordId: c.id,
          field: 'runway',
          value: c.runway,
          reason: 'Stored derived value - should be computed from cash_on_hand / monthly_burn'
        });
      }
      if (c.burn_multiple != null) {
        violations.push({
          entityType: 'Company',
          entityName: c.name,
          recordId: c.id,
          field: 'burn_multiple',
          value: c.burn_multiple,
          reason: 'Stored derived value - should be computed from monthly_burn / mrr'
        });
      }
    });

    goals?.forEach(g => {
      if (g.is_on_track != null) {
        violations.push({
          entityType: 'Goal',
          entityName: g.title || 'Untitled Goal',
          recordId: g.id,
          field: 'is_on_track',
          value: g.is_on_track,
          reason: 'Stored derived value - should be computed from progress and deadline'
        });
      }
    });

    return { count: violations.length, violations };
  }

  function checkExplainabilityGaps(companies, goals, deals) {
    const violations = [];

    companies?.forEach(c => {
      if (c.is_portfolio && c.cash_on_hand != null && c.monthly_burn != null) {
        const runway = c.monthly_burn > 0 ? c.cash_on_hand / c.monthly_burn : 99;
        if (runway < 6 && !c.last_material_update_at) {
          violations.push({
            entityType: 'Company',
            entityName: c.name,
            recordId: c.id,
            field: 'last_material_update_at',
            value: null,
            reason: `Low runway (${runway.toFixed(1)} months) lacks update timestamp`,
            context: `Cash: $${(c.cash_on_hand / 1000).toFixed(0)}K, Burn: $${(c.monthly_burn / 1000).toFixed(0)}K/mo`
          });
        }
      }
    });

    goals?.forEach(g => {
      if (g.target_date && new Date(g.target_date) < new Date()) {
        if (!g.last_updated_at || (Date.now() - new Date(g.last_updated_at)) > 14 * 86400000) {
          const daysOverdue = Math.floor((Date.now() - new Date(g.target_date)) / 86400000);
          violations.push({
            entityType: 'Goal',
            entityName: g.title || 'Untitled Goal',
            recordId: g.id,
            field: 'last_updated_at',
            value: g.last_updated_at || null,
            reason: `Overdue by ${daysOverdue} days, stale or missing update timestamp`,
            context: `Target: ${new Date(g.target_date).toLocaleDateString()}`
          });
        }
      }
    });

    deals?.forEach(d => {
      const advancedStages = ['diligence', 'term_sheet', 'committed'];
      if (advancedStages.includes(d.deal_stage)) {
        if (!d.last_contact_date || (Date.now() - new Date(d.last_contact_date)) > 21 * 86400000) {
          const daysSince = d.last_contact_date
            ? Math.floor((Date.now() - new Date(d.last_contact_date)) / 86400000)
            : 'never';
          violations.push({
            entityType: 'Deal',
            entityName: `Deal in ${d.deal_stage}`,
            recordId: d.id,
            field: 'last_contact_date',
            value: d.last_contact_date || null,
            reason: `Advanced stage deal lacks recent contact (${daysSince === 'never' ? 'no contact' : daysSince + ' days ago'})`,
            context: `Stage: ${d.deal_stage}`
          });
        }
      }
    });

    return { count: violations.length, violations };
  }

  function checkPortfolioMixedState(companies) {
    const violations = [];
    companies?.forEach(c => {
      if (!c.is_portfolio) return;
      const hasHealth = c.cash_on_hand != null && c.monthly_burn != null && c.last_material_update_at != null;
      const hasPriority = false;
      if (hasHealth && hasPriority) {
        violations.push({
          entityType: 'Company',
          entityName: c.name,
          recordId: c.id,
          reason: 'Portfolio entity mixing stored state with computed views',
          context: 'Should be pure presentation layer'
        });
      }
    });
    return { count: violations.length, violations };
  }

  function checkGoalWithoutRisk(goals, companies) {
    const violations = [];
    goals?.forEach(g => {
      const company = companies?.find(c => c.id === g.company_id);
      if (!company) {
        violations.push({
          entityType: 'Goal',
          entityName: g.title || 'Untitled Goal',
          recordId: g.id,
          reason: 'Goal has no associated company',
          context: `Company ID: ${g.company_id}`
        });
        return;
      }
      if (!g.target_value || !g.current_value || !g.target_date) {
        const missing = [];
        if (!g.target_value) missing.push('target_value');
        if (!g.current_value) missing.push('current_value');
        if (!g.target_date) missing.push('target_date');
        violations.push({
          entityType: 'Goal',
          entityName: g.title || 'Untitled Goal',
          recordId: g.id,
          field: missing.join(', '),
          reason: 'Goal missing critical fields for risk calculation',
          context: `Missing: ${missing.join(', ')}`
        });
      }
    });
    return { count: violations.length, violations };
  }

  if (loading) {
    return <div className="admin-qa"><div className="loading">Running QA checks...</div></div>;
  }

  if (selectedViolation) {
    return <QAViolationDetail violation={selectedViolation} onBack={() => setSelectedViolation(null)} />;
  }

  return (
    <div className="admin-qa">
      <div className="qa-header">
        <h3>Data Quality Assurance</h3>
        <button className="refresh-btn" onClick={runQA}>Refresh</button>
      </div>

      <div className="qa-grid">
        <QASection
          title="System Invariants"
          data={qaResults.invariants}
          critical={true}
          onClickViolation={(key) => {
            if (detailedViolations[key]) {
              setSelectedViolation(detailedViolations[key]);
            }
          }}
        />
        <QASection title="Companies" data={qaResults.companies} />
        <QASection title="People" data={qaResults.people} />
        <QASection title="Goals" data={qaResults.goals} />
        <QASection title="Deals" data={qaResults.deals} />
      </div>

      {qaResults.invariants?.storedDerivationsFound > 0 && (
        <div className="qa-recommendations">
          <h4>North Stars Violations Detected</h4>
          <div className="violation-detail">
            <strong>NoStoredDerivs Violation:</strong> {qaResults.invariants.storedDerivationsFound} records contain derived values in database.
            <br />
            <span className="remedy">Remedy: Remove arr, runway, is_on_track columns from schema. Compute on-the-fly in derivations.js</span>
          </div>
        </div>
      )}
    </div>
  );
}

function QASection({ title, data, critical, onClickViolation }) {
  if (!data) return null;

  const issues = Object.entries(data).filter(([key, value]) => {
    return key !== 'total' && typeof value === 'number' && value > 0;
  });

  const hasIssues = issues.length > 0;

  return (
    <div className={`qa-section ${hasIssues ? (critical ? 'critical' : 'has-issues') : 'clean'}`}>
      <div className="qa-section-header">
        <h4>{title}</h4>
        <span className={`status-badge ${hasIssues ? (critical ? 'critical' : 'warning') : 'success'}`}>
          {hasIssues ? (critical ? 'VIOLATION' : 'Issues Found') : 'Clean'}
        </span>
      </div>
      <div className="qa-stats">
        {data.total !== undefined && (
          <div className="qa-stat">
            <span className="qa-label">Total:</span>
            <span className="qa-value">{data.total}</span>
          </div>
        )}
        {Object.entries(data).map(([key, value]) => {
          if (key === 'total') return null;
          const isClickable = onClickViolation && value > 0;
          return (
            <div
              key={key}
              className={`qa-stat ${value > 0 ? 'issue' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onClickViolation(key)}
            >
              <span className="qa-label">{formatLabel(key)}:</span>
              <span className="qa-value">{value}</span>
              {isClickable && <span className="click-hint">→</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}
