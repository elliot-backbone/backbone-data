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
      const { data: firms } = await supabase.from('firms').select('*');
      const { data: rounds } = await supabase.from('rounds').select('*');
      const { data: goals } = await supabase.from('goals').select('*');
      const { data: deals } = await supabase.from('deals').select('*');

      results.companies = {
        total: companies?.length || 0,
        portfolio: companies?.filter(c => c.is_portfolio).length || 0,
        missingFounder: companies?.filter(c => !c.founder_id).length || 0,
        negativeCash: companies?.filter(c => c.cash_on_hand < 0).length || 0,
        zeroRunway: companies?.filter(c => c.runway <= 0).length || 0
      };

      results.people = {
        total: people?.length || 0,
        duplicateEmails: checkDuplicateEmails(people || []),
        missingRole: people?.filter(p => !p.role).length || 0,
        investors: people?.filter(p => p.role === 'investor').length || 0
      };

      results.firms = {
        total: firms?.length || 0,
        invalidCheckRanges: firms?.filter(f => f.typical_check_min > f.typical_check_max).length || 0
      };

      results.rounds = {
        total: rounds?.length || 0,
        active: rounds?.filter(r => r.status === 'active').length || 0,
        oversubscribed: rounds?.filter(r => r.raised_amount > r.target_amount).length || 0,
        orphaned: rounds?.filter(r => !companies?.find(c => c.id === r.company_id)).length || 0
      };

      results.goals = {
        total: goals?.length || 0,
        overdue: goals?.filter(g => new Date(g.target_date) < new Date()).length || 0,
        orphaned: goals?.filter(g => !companies?.find(c => c.id === g.company_id)).length || 0
      };

      results.deals = {
        total: deals?.length || 0,
        missingRound: deals?.filter(d => !rounds?.find(r => r.id === d.round_id)).length || 0,
        missingPerson: deals?.filter(d => !people?.find(p => p.id === d.person_id)).length || 0
      };

      setQaResults(results);
    } catch (error) {
      console.error('QA check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function checkDuplicateEmails(people) {
    const emails = people.map(p => p.email?.toLowerCase());
    const duplicates = emails.filter((e, i) => e && emails.indexOf(e) !== i);
    return new Set(duplicates).size;
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
        <QASection title="Companies" data={qaResults.companies} />
        <QASection title="People" data={qaResults.people} />
        <QASection title="Firms" data={qaResults.firms} />
        <QASection title="Rounds" data={qaResults.rounds} />
        <QASection title="Goals" data={qaResults.goals} />
        <QASection title="Deals" data={qaResults.deals} />
      </div>
    </div>
  );
}

function QASection({ title, data }) {
  if (!data) return null;

  const issues = Object.entries(data).filter(([key, value]) => {
    return key !== 'total' && typeof value === 'number' && value > 0;
  });

  const hasIssues = issues.length > 0;

  return (
    <div className={`qa-section ${hasIssues ? 'has-issues' : 'clean'}`}>
      <div className="qa-section-header">
        <h4>{title}</h4>
        <span className={`status-badge ${hasIssues ? 'warning' : 'success'}`}>
          {hasIssues ? 'Issues Found' : 'Clean'}
        </span>
      </div>
      <div className="qa-stats">
        <div className="qa-stat">
          <span className="qa-label">Total:</span>
          <span className="qa-value">{data.total}</span>
        </div>
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
