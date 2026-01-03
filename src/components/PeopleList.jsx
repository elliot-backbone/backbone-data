import { useState } from 'react';
import './PeopleList.css';

const ROLE_LABELS = {
  founder: 'Founder',
  investor: 'Investor',
  operator: 'Operator',
  advisor: 'Advisor',
  employee: 'Employee'
};

export default function PeopleList({ rawData, onSelectPerson, filterToInvestors = false, simpleSearch = false }) {
  const [filterRole, setFilterRole] = useState(filterToInvestors ? 'investor' : 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const people = filterToInvestors
    ? (rawData.people || []).filter(p => p.role === 'investor')
    : (rawData.people || []);
  const firms = rawData.firms || [];
  const allDeals = rawData.deals || [];
  const companies = rawData.companies || [];
  const rounds = rawData.rounds || [];

  const portfolioCompanies = companies.filter(c => c.isPortfolio);
  const portfolioRounds = rounds.filter(round => {
    const companyId = round.companyId || round.company_id;
    return portfolioCompanies.some(c => c.id === companyId);
  });

  const deals = allDeals.filter(deal => {
    return portfolioRounds.some(r => r.id === deal.roundId);
  });

  const enrichedPeople = people.map(person => {
    const firm = firms.find(f => f.id === person.firmId);
    const personDeals = deals.filter(d => d.personId === person.id);
    const activeDeals = personDeals.filter(d =>
      ['meeting_scheduled', 'meeting_held', 'diligence', 'term_sheet', 'committed'].includes(d.dealStage)
    );

    const daysSinceContact = person.lastContactedAt
      ? Math.floor((Date.now() - new Date(person.lastContactedAt)) / 86400000)
      : null;

    return {
      ...person,
      firmName: firm?.name || null,
      totalDeals: personDeals.length,
      activeDeals: activeDeals.length,
      daysSinceContact
    };
  });

  const filtered = enrichedPeople
    .filter(p => filterRole === 'all' || p.role === filterRole)
    .filter(p =>
      searchTerm === '' ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.firmName && p.firmName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const sorted = [...filtered].sort((a, b) => {
    if (a.role === 'investor' && b.role === 'investor') {
      return b.activeDeals - a.activeDeals;
    }
    return (a.daysSinceContact || 999) - (b.daysSinceContact || 999);
  });

  const getContactFreshness = (days) => {
    if (days === null) return { label: 'Never', color: '#9ca3af' };
    if (days < 7) return { label: `${days}d ago`, color: '#10b981' };
    if (days < 30) return { label: `${days}d ago`, color: '#3b82f6' };
    if (days < 90) return { label: `${days}d ago`, color: '#f59e0b' };
    return { label: `${days}d ago`, color: '#ef4444' };
  };

  return (
    <div className="people-list">
      <div className="people-controls">
        <input
          type="text"
          placeholder={simpleSearch ? "Search..." : "Search by name, email, or firm..."}
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {!simpleSearch && (
          <div className="filter-chips">
            <button
              className={`filter-chip ${filterRole === 'all' ? 'active' : ''}`}
              onClick={() => setFilterRole('all')}
            >
              All ({people.length})
            </button>
            {Object.entries(ROLE_LABELS).map(([role, label]) => {
              const count = people.filter(p => p.role === role).length;
              return (
                <button
                  key={role}
                  className={`filter-chip ${filterRole === role ? 'active' : ''}`}
                  onClick={() => setFilterRole(role)}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="people-grid">
        {sorted.map(person => {
          const freshness = getContactFreshness(person.daysSinceContact);
          return (
            <div
              key={person.id}
              className="person-card"
              onClick={() => onSelectPerson && onSelectPerson(person)}
            >
              <div className="person-header">
                <div className="person-info">
                  <h3 className="person-name">
                    {person.firstName} {person.lastName}
                  </h3>
                  <p className="person-title">{person.title}</p>
                </div>
              </div>

              <div className="person-meta">
                <span className="role-badge">{ROLE_LABELS[person.role]}</span>
                {person.firmName && (
                  <span className="firm-badge">{person.firmName}</span>
                )}
              </div>

              <div className="person-contact">
                <span className="contact-email">{person.email}</span>
              </div>

              <div className="person-stats">
                {person.role === 'investor' && (
                  <>
                    <div className="stat">
                      <span className="stat-value">{person.activeDeals}</span>
                      <span className="stat-label">Active</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{person.totalDeals}</span>
                      <span className="stat-label">Total</span>
                    </div>
                  </>
                )}
                <div className="stat">
                  <span className="stat-value" style={{ color: freshness.color }}>
                    {freshness.label}
                  </span>
                  <span className="stat-label">Last Contact</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="empty-state">No people found</div>
      )}
    </div>
  );
}
