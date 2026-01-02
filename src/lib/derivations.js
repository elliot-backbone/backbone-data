export function deriveCompanyMetrics(company) {
  const runway = company.monthlyBurn > 0 
    ? company.cashOnHand / company.monthlyBurn 
    : null;
  
  const burnMultiple = company.mrr > 0 
    ? company.monthlyBurn / company.mrr 
    : null;

  const daysSinceUpdate = company.lastMaterialUpdate_at
    ? Math.floor((Date.now() - new Date(company.lastMaterialUpdate_at)) / 86400000)
    : null;

  return { ...company, runway, burnMultiple, daysSinceUpdate };
}

export function deriveRoundMetrics(round) {
  const coverage = round.targetAmount > 0 ? round.raisedAmount / round.targetAmount : 0;
  const daysOpen = round.startedAt ? Math.floor((Date.now() - new Date(round.startedAt)) / 86400000) : 0;
  const daysToClose = round.targetCloseDate ? Math.floor((new Date(round.targetCloseDate) - Date.now()) / 86400000) : null;
  return { ...round, coverage, daysOpen, daysToClose };
}

export function detectIssues(companies, rounds, goals) {
  const issues = [];
  let issueId = 1;

  const enrichedCompanies = companies.map(deriveCompanyMetrics);
  const enrichedRounds = rounds.map(deriveRoundMetrics);

  for (const company of enrichedCompanies) {
    if (!company.isPortfolio) continue;

    // Capital Sufficiency: Runway critical
    if (company.runway !== null && company.runway < 6) {
      const severity = company.runway < 3 ? 'critical' : 'high';
      issues.push({
        id: `issue-${issueId++}`,
        companyId: company.id,
        type: 'capital_sufficiency',
        severity,
        urgencyScore: Math.round(100 - (company.runway * 10)),
        title: `Runway at ${company.runway.toFixed(1)} months`,
        suggestedAction: company.runway < 3 ? 'Emergency bridge or accelerate close' : 'Review fundraising timeline',
        triggerCondition: `runway=${company.runway.toFixed(1)} < 6`,
      });
    }

    // Revenue Viability: Burn multiple too high
    if (company.burnMultiple !== null && company.burnMultiple > 3) {
      issues.push({
        id: `issue-${issueId++}`,
        companyId: company.id,
        type: 'revenue_viability',
        severity: company.burnMultiple > 5 ? 'high' : 'medium',
        urgencyScore: Math.round(Math.min(company.burnMultiple * 15, 90)),
        title: `Burn multiple at ${company.burnMultiple.toFixed(1)}x`,
        suggestedAction: 'Review unit economics and path to efficiency',
        triggerCondition: `burnMultiple=${company.burnMultiple.toFixed(1)} > 3`,
      });
    }

    // Attention Misallocation: No recent contact
    if (company.daysSinceUpdate !== null && company.daysSinceUpdate > 14) {
      issues.push({
        id: `issue-${issueId++}`,
        companyId: company.id,
        type: 'attention_misallocation',
        severity: company.daysSinceUpdate > 30 ? 'high' : 'medium',
        urgencyScore: Math.round(Math.min(company.daysSinceUpdate * 2, 80)),
        title: `No update in ${company.daysSinceUpdate} days`,
        suggestedAction: 'Schedule check-in',
        triggerCondition: `daysSinceUpdate=${company.daysSinceUpdate} > 14`,
      });
    }
  }

  // Round-level issues
  for (const round of enrichedRounds) {
    if (round.status !== 'active' && round.status !== 'closing') continue;
    const company = enrichedCompanies.find(c => c.id === round.company_id);
    if (!company?.isPortfolio) continue;

    if (round.daysOpen > 45 && round.coverage < 0.3) {
      issues.push({
        id: `issue-${issueId++}`,
        companyId: company.id,
        type: 'capital_sufficiency',
        severity: 'high',
        urgencyScore: Math.round(60 + round.daysOpen * 0.5),
        title: `${round.roundType} open ${round.daysOpen}d, ${(round.coverage * 100).toFixed(0)}% covered`,
        suggestedAction: 'Assess pipeline, consider repositioning',
        triggerCondition: `daysOpen=${round.daysOpen} > 45 && coverage < 0.3`,
      });
    }

    if (!round.leadInvestor_id && round.daysOpen > 30) {
      issues.push({
        id: `issue-${issueId++}`,
        companyId: company.id,
        type: 'market_access',
        severity: 'medium',
        urgencyScore: Math.round(40 + round.daysOpen * 0.3),
        title: `${round.roundType} needs lead, ${round.daysOpen}d open`,
        suggestedAction: 'Focus on lead-capable firms',
        triggerCondition: `leadInvestor_id=null && daysOpen=${round.daysOpen} > 30`,
      });
    }
  }

  // Goal-level issues
  for (const goal of goals) {
    const company = enrichedCompanies.find(c => c.id === goal.company_id);
    if (!company?.isPortfolio) continue;

    const progress = goal.targetValue > 0 ? goal.currentValue / goal.targetValue : 0;
    const daysToDeadline = goal.targetDate ? Math.floor((new Date(goal.targetDate) - Date.now()) / 86400000) : null;
    const daysSinceUpdate = goal.lastUpdatedAt ? Math.floor((Date.now() - new Date(goal.lastUpdatedAt)) / 86400000) : 999;

    // Compute status (derived, not stored)
    const isCompleted = progress >= 1;
    const isAtRisk = !isCompleted && (daysToDeadline !== null && daysToDeadline < 0 || (daysToDeadline < 30 && progress < 0.3));
    const isStalled = !isCompleted && daysSinceUpdate > 21;

    if (isCompleted) continue;

    if (isAtRisk || (daysToDeadline !== null && daysToDeadline < 30 && progress < 0.7)) {
      const severity = daysToDeadline < 0 ? 'high' : progress < 0.3 ? 'high' : 'medium';
      issues.push({
        id: `issue-${issueId++}`,
        companyId: company.id,
        type: 'goal_risk',
        severity,
        urgencyScore: Math.round(50 + (1 - progress) * 30 + Math.max(0, 30 - daysToDeadline)),
        title: `${goal.title}: ${(progress * 100).toFixed(0)}% complete, ${daysToDeadline}d left`,
        suggestedAction: 'Review blockers and acceleration options',
        triggerCondition: `progress=${progress.toFixed(2)} < 0.7 && daysToDeadline=${daysToDeadline} < 30`,
      });
    }

    if (isStalled) {
      issues.push({
        id: `issue-${issueId++}`,
        companyId: company.id,
        type: 'goal_risk',
        severity: 'medium',
        urgencyScore: Math.round(40 + daysSinceUpdate),
        title: `${goal.title}: No update in ${daysSinceUpdate} days`,
        suggestedAction: 'Check in on progress and blockers',
        triggerCondition: `daysSinceUpdate=${daysSinceUpdate} > 21`,
      });
    }
  }

  return issues.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.urgencyScore - a.urgencyScore;
  });
}

export function calculateHealth(company, issues) {
  const companyIssues = issues.filter(i => i.companyId === company.id);
  let healthScore = 100;
  for (const issue of companyIssues) {
    const penalty = issue.severity === 'critical' ? 25 : issue.severity === 'high' ? 15 : issue.severity === 'medium' ? 8 : 3;
    healthScore -= penalty;
  }
  return Math.max(0, Math.min(100, healthScore));
}
