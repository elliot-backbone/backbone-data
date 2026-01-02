export function applyResolution(issue, rawData) {
  const updatedData = {
    ...rawData,
    companies: [...rawData.companies],
    rounds: [...rawData.rounds],
    goals: [...rawData.goals],
  };
  const { companyId, category, title } = issue;

  const companyIndex = updatedData.companies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) return rawData;

  const company = { ...updatedData.companies[companyIndex] };

  switch (category) {
    case 'capital_sufficiency':
      if (title.includes('Runway')) {
        const extendedRunway = company.runway + 6;
        company.cashOnHand = Math.round(company.monthlyBurn * extendedRunway);
        company.lastMaterialUpdate_at = new Date().toISOString();
      }
      break;

    case 'revenue_viability':
      if (title.includes('Burn multiple')) {
        const targetMultiple = 2.0;
        const newMrr = Math.round(company.monthlyBurn / targetMultiple);
        company.mrr = newMrr;
        company.arr = newMrr * 12;
        company.lastMaterialUpdate_at = new Date().toISOString();
      }
      break;

    case 'attention_misallocation':
      if (title.includes('No update')) {
        company.lastMaterialUpdate_at = new Date().toISOString();
      }
      break;

    case 'market_access':
      if (title.includes('needs lead')) {
        const round = updatedData.rounds.find(r =>
          r.company_id === companyId &&
          (r.status === 'active' || r.status === 'closing')
        );
        if (round) {
          const roundIndex = updatedData.rounds.findIndex(r => r.id === round.id);
          const investors = updatedData.people.filter(p => p.role === 'investor');
          if (investors.length > 0) {
            const leadInvestor = investors[0];
            updatedData.rounds[roundIndex] = {
              ...round,
              leadInvestor_id: leadInvestor.id,
              leadInvestor: `${leadInvestor.firstName} ${leadInvestor.lastName}`,
            };
          }
        }
      }
      break;

    case 'goal_risk':
      const goalTitle = title.split(':')[0];
      const goal = updatedData.goals.find(g =>
        g.company_id === companyId &&
        g.title === goalTitle
      );
      if (goal) {
        const goalIndex = updatedData.goals.findIndex(g => g.id === goal.id);
        const currentProgress = goal.currentValue / goal.targetValue;
        const newProgress = Math.min(currentProgress + 0.3, 1.0);
        updatedData.goals[goalIndex] = {
          ...goal,
          currentValue: Math.round(goal.targetValue * newProgress),
          lastUpdatedAt: new Date().toISOString(),
        };
      }
      break;

    default:
      break;
  }

  updatedData.companies[companyIndex] = company;
  return updatedData;
}

export function getResolutionSummary(issue) {
  const { category, title } = issue;

  switch (category) {
    case 'capital_sufficiency':
      if (title.includes('Runway')) {
        return 'Extended runway by 6 months (bridge round secured or cost optimization)';
      }
      return 'Capital sufficiency improved';

    case 'revenue_viability':
      if (title.includes('Burn multiple')) {
        return 'Improved burn multiple to 2.0x (revenue acceleration or cost reduction)';
      }
      return 'Revenue viability improved';

    case 'attention_misallocation':
      if (title.includes('No update')) {
        return 'Material update received and logged';
      }
      return 'Attention restored';

    case 'market_access':
      if (title.includes('needs lead')) {
        return 'Lead investor secured for round';
      }
      return 'Market access improved';

    case 'goal_risk':
      return 'Goal progress updated (+30% advancement)';

    default:
      return 'Issue resolved';
  }
}
