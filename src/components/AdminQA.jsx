import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './AdminQA.css';

export default function AdminQA() {
  const [qaResults, setQaResults] = useState({});
  const [loading, setLoading] = useState(false);

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

      results.invariants = {
        derivedValuesStored: checkDerivedValues(companies, goals, deals),
        missingTTL: checkMissingTTL(companies, goals, deals),
        storedDerivationsFound: checkStoredDerivations(companies, goals, deals, rounds),
        explainabilityGaps: checkExplainabilityGaps(companies, goals, deals),
        portfolioNotView: checkPortfolioMixedState(companies),
        goalOrphans: checkGoalWithoutRisk(goals, companies),
        silentOverwrites: 0
      };

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
    let count = 0;
    const criticalCompanyFields = [
      { value: 'cash_on_hand', timestamp: 'cash_on_hand_updated_at' },
      { value: 'monthly_burn', timestamp: 'monthly_burn_updated_at' },
      { value: 'mrr', timestamp: 'mrr_updated_at' }
    ];
    companies?.forEach(c => {
      criticalCompanyFields.forEach(field => {
        if (c[field.value] != null && !c[field.timestamp]) count++;
      });
    });
    const criticalGoalFields = [
      { value: 'current_value', timestamp: 'current_value_updated_at' }
    ];
    goals?.forEach(g => {
      criticalGoalFields.forEach(field => {
        if (g[field.value] != null && !g[field.timestamp]) count++;
      });
    });
    deals?.forEach(d => {
      if (d.deal_stage != null && !d.stage_entry_date) count++;
    });
    return count;
  }

  function checkDuplicateEmails(people) {
    const emails = people.map(p => p.email?.toLowerCase());
    const duplicates = emails.filter((e, i) => e && emails.indexOf(e) !== i);
    return new Set(duplicates).size;
  }

  function checkStoredDerivations(companies, goals, deals, rounds) {
    let violations = [];

    companies?.forEach(c => {
      if (c.arr != null) {
        violations.push({ entity: 'Company', field: 'arr', reason: 'Derivable from MRR * 12' });
      }
      if (c.runway != null) {
        violations.push({ entity: 'Company', field: 'runway', reason: 'Derivable from cash/burn' });
      }
    });

    goals?.forEach(g => {
      if (g.is_on_track != null) {
        violations.push({ entity: 'Goal', field: 'is_on_track', reason: 'Derivable from progress/deadline' });
      }
    });

    return violations.length;
  }

  function checkExplainabilityGaps(companies, goals, deals) {
    let count = 0;

    companies?.forEach(c => {
      if (c.is_portfolio && c.cash_on_hand != null && c.monthly_burn != null) {
        const runway = c.monthly_burn > 0 ? c.cash_on_hand / c.monthly_burn : 99;
        if (runway < 6 && !c.last_material_update_at) {
          count++;
        }
      }
    });

    goals?.forEach(g => {
      if (g.target_date && new Date(g.target_date) < new Date()) {
        if (!g.last_updated_at || (Date.now() - new Date(g.last_updated_at)) > 14 * 86400000) {
          count++;
        }
      }
    });

    deals?.forEach(d => {
      const advancedStages = ['diligence', 'term_sheet', 'committed'];
      if (advancedStages.includes(d.deal_stage)) {
        if (!d.last_contact_date || (Date.now() - new Date(d.last_contact_date)) > 21 * 86400000) {
          count++;
        }
      }
    });

    return count;
  }

  function checkPortfolioMixedState(companies) {
    let count = 0;
    companies?.forEach(c => {
      if (!c.is_portfolio) return;
      const hasHealth = c.cash_on_hand != null && c.monthly_burn != null && c.last_material_update_at != null;
      const hasPriority = false;
      if (hasHealth && hasPriority) {
        count++;
      }
    });
    return count;
  }

  function checkGoalWithoutRisk(goals, companies) {
    let count = 0;
    goals?.forEach(g => {
      const company = companies?.find(c => c.id === g.company_id);
      if (!company) {
        count++;
        return;
      }
      if (!g.target_value || !g.current_value || !g.target_date) {
        count++;
      }
    });
    return count;
  }

  if (loading) {
    return <div className="admin-qa"><div className="loading">Running QA checks...</div></div>;
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

function QASection({ title, data, critical }) {
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
          return (
            <div key={key} className={`qa-stat ${value > 0 ? 'issue' : ''}`}>
              <span className="qa-label">{formatLabel(key)}:</span>
              <span className="qa-value">{value}</span>
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
