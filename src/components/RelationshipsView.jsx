import { useState } from 'react';
import './RelationshipsView.css';

export default function RelationshipsView({ rawData, onSelectRelationship }) {
  const [focusEntity, setFocusEntity] = useState(null);
  const companies = rawData.companies || [];
  const people = rawData.people || [];
  const firms = rawData.firms || [];
  const deals = rawData.deals || [];
  const rounds = rawData.rounds || [];

  const buildRelationshipMap = () => {
    const relationships = [];

    deals.forEach(deal => {
      const round = rounds.find(r => r.id === deal.round_id);
      const company = companies.find(c => c.id === round?.company_id);
      const person = people.find(p => p.id === deal.person_id);
      const firm = firms.find(f => f.id === deal.firm_id);

      if (company && person && firm) {
        relationships.push({
          id: deal.id,
          type: 'deal',
          company,
          person,
          firm,
          dealStage: deal.dealStage,
          introducedBy: deal.introducedBy_id ? people.find(p => p.id === deal.introducedBy_id) : null
        });
      }
    });

    return relationships;
  };

  const relationships = buildRelationshipMap();

  const portfolioRelationships = relationships.filter(r => r.company.isPortfolio);

  const companyConnections = {};
  portfolioRelationships.forEach(rel => {
    if (!companyConnections[rel.company.id]) {
      companyConnections[rel.company.id] = {
        company: rel.company,
        firms: new Set(),
        investors: new Set(),
        introSources: new Set()
      };
    }
    companyConnections[rel.company.id].firms.add(rel.firm.name);
    companyConnections[rel.company.id].investors.add(`${rel.person.firstName} ${rel.person.lastName}`);
    if (rel.introducedBy) {
      companyConnections[rel.company.id].introSources.add(
        `${rel.introducedBy.firstName} ${rel.introducedBy.lastName}`
      );
    }
  });

  const companyStats = Object.values(companyConnections).map(conn => ({
    company: conn.company,
    firmCount: conn.firms.size,
    investorCount: conn.investors.size,
    introSourceCount: conn.introSources.size
  })).sort((a, b) => b.investorCount - a.investorCount);

  const investorActivity = {};
  portfolioRelationships.forEach(rel => {
    const investorKey = `${rel.person.firstName} ${rel.person.lastName}`;
    if (!investorActivity[investorKey]) {
      investorActivity[investorKey] = {
        person: rel.person,
        firm: rel.firm,
        companies: new Set(),
        activeDeals: 0
      };
    }
    investorActivity[investorKey].companies.add(rel.company.name);
    if (['meeting_scheduled', 'meeting_held', 'diligence', 'term_sheet', 'committed'].includes(rel.dealStage)) {
      investorActivity[investorKey].activeDeals++;
    }
  });

  const topInvestors = Object.values(investorActivity)
    .map(inv => ({
      ...inv,
      companyCount: inv.companies.size
    }))
    .sort((a, b) => b.activeDeals - a.activeDeals)
    .slice(0, 15);

  const introSourceActivity = {};
  portfolioRelationships.forEach(rel => {
    if (rel.introducedBy) {
      const sourceKey = `${rel.introducedBy.firstName} ${rel.introducedBy.lastName}`;
      if (!introSourceActivity[sourceKey]) {
        introSourceActivity[sourceKey] = {
          person: rel.introducedBy,
          introCount: 0,
          companies: new Set(),
          firms: new Set()
        };
      }
      introSourceActivity[sourceKey].introCount++;
      introSourceActivity[sourceKey].companies.add(rel.company.name);
      introSourceActivity[sourceKey].firms.add(rel.firm.name);
    }
  });

  const topIntroSources = Object.values(introSourceActivity)
    .sort((a, b) => b.introCount - a.introCount)
    .slice(0, 10);

  return (
    <div className="relationships-view">
      <div className="relationships-header">
        <div className="header-stat">
          <span className="stat-value">{portfolioRelationships.length}</span>
          <span className="stat-label">Total Relationships</span>
        </div>
        <div className="header-stat">
          <span className="stat-value">{companyStats.length}</span>
          <span className="stat-label">Connected Companies</span>
        </div>
        <div className="header-stat">
          <span className="stat-value">{topInvestors.length}</span>
          <span className="stat-label">Active Investors</span>
        </div>
        <div className="header-stat">
          <span className="stat-value">{topIntroSources.length}</span>
          <span className="stat-label">Intro Sources</span>
        </div>
      </div>

      <div className="relationships-sections">
        <section className="relationships-section">
          <h2 className="section-title">Company Network Strength</h2>
          <div className="network-grid">
            {companyStats.map(stat => {
              const firstRelationship = portfolioRelationships.find(r => r.company.id === stat.company.id);
              return (
              <div
                key={stat.company.id}
                className="network-card"
                onClick={() => firstRelationship && onSelectRelationship && onSelectRelationship(firstRelationship)}
              >
                <h3 className="network-company-name">{stat.company.name}</h3>
                <div className="network-stats">
                  <div className="network-stat">
                    <span className="network-stat-value">{stat.investorCount}</span>
                    <span className="network-stat-label">Investors</span>
                  </div>
                  <div className="network-stat">
                    <span className="network-stat-value">{stat.firmCount}</span>
                    <span className="network-stat-label">Firms</span>
                  </div>
                  <div className="network-stat">
                    <span className="network-stat-value">{stat.introSourceCount}</span>
                    <span className="network-stat-label">Intros</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        <section className="relationships-section">
          <h2 className="section-title">Most Active Investors</h2>
          <div className="investors-list">
            {topInvestors.map((inv, idx) => (
              <div key={idx} className="investor-row">
                <div className="investor-rank">{idx + 1}</div>
                <div className="investor-info">
                  <div className="investor-name">
                    {inv.person.firstName} {inv.person.lastName}
                  </div>
                  <div className="investor-firm">{inv.firm.name}</div>
                </div>
                <div className="investor-stats">
                  <div className="investor-stat">
                    <span className="investor-stat-value active">{inv.activeDeals}</span>
                    <span className="investor-stat-label">Active</span>
                  </div>
                  <div className="investor-stat">
                    <span className="investor-stat-value">{inv.companyCount}</span>
                    <span className="investor-stat-label">Companies</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relationships-section">
          <h2 className="section-title">Top Intro Sources</h2>
          <div className="intro-sources-list">
            {topIntroSources.map((source, idx) => (
              <div key={idx} className="intro-source-card">
                <div className="intro-source-header">
                  <div className="intro-source-rank">{idx + 1}</div>
                  <div className="intro-source-info">
                    <div className="intro-source-name">
                      {source.person.firstName} {source.person.lastName}
                    </div>
                    <div className="intro-source-meta">
                      {source.person.title} · {source.person.role}
                    </div>
                  </div>
                </div>
                <div className="intro-source-stats">
                  <div className="intro-stat">
                    <span className="intro-stat-value">{source.introCount}</span>
                    <span className="intro-stat-label">Introductions</span>
                  </div>
                  <div className="intro-stat">
                    <span className="intro-stat-value">{source.companies.size}</span>
                    <span className="intro-stat-label">Companies</span>
                  </div>
                  <div className="intro-stat">
                    <span className="intro-stat-value">{source.firms.size}</span>
                    <span className="intro-stat-label">Firms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
