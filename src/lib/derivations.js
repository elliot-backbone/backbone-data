export function computeAllDerivations(rawData, resolvedPriorities = []) {
  const { companies, rounds, goals, investors, companyInvestors, talent, employees } = rawData;

  const l0 = preprocessL0(rawData);
  const l1 = computeL1Derivations(l0);
  const l2 = computeL2Trajectories(l1);
  const l3 = computeL3Health(l2);
  const l4 = computeL4Issues(l3, resolvedPriorities);
  const l5 = computeL5Priorities(l4);
  const l6 = computeL6Output(l5);

  return { l0, l1, l2, l3, l4, l5, l6 };
}

function preprocessL0(rawData) {
  return {
    companies: rawData.companies || [],
    rounds: rawData.rounds || [],
    goals: rawData.goals || [],
    investors: rawData.investors || [],
    companyInvestors: rawData.companyInvestors || [],
    talent: rawData.talent || [],
    employees: rawData.employees || [],
    timestamp: Date.now()
  };
}

function computeL1Derivations(l0) {
  const companies = l0.companies.map(c => deriveCompanyL1(c, l0));
  const rounds = l0.rounds.map(r => deriveRoundL1(r, l0));
  const goals = l0.goals.map(g => deriveGoalL1(g, l0));
  const investors = l0.investors.map(i => deriveInvestorL1(i, l0));

  return { ...l0, companies, rounds, goals, investors };
}

function deriveCompanyL1(company, l0) {
  const now = Date.now();

  const arr = (company.mrr || 0) * 12;

  const runway = (company.monthlyBurn || 0) > 0
    ? (company.cashOnHand || 0) / company.monthlyBurn
    : null;

  const burnMultiple = (company.mrr || 0) > 0
    ? (company.monthlyBurn || 0) / company.mrr
    : null;

  const daysSinceUpdate = company.lastMaterialUpdateAt
    ? Math.floor((now - new Date(company.lastMaterialUpdateAt)) / 86400000)
    : null;

  const companyAge = company.foundedAt
    ? Math.floor((now - new Date(company.foundedAt)) / 86400000)
    : null;

  const employeeCount = l0.employees?.filter(e =>
    e.companyId === company.id && !e.endDate
  ).length || 0;

  const companyInvestments = l0.companyInvestors?.filter(ci =>
    ci.companyId === company.id
  ) || [];
  const investorCount = new Set(companyInvestments.map(ci => ci.investorId)).size;

  const companyRounds = l0.rounds?.filter(r => r.companyId === company.id) || [];
  const latestRound = companyRounds.sort((a, b) =>
    new Date(b.closedAt || b.targetCloseDate || 0) - new Date(a.closedAt || a.targetCloseDate || 0)
  )[0];
  const latestRoundStage = latestRound?.roundType || null;

  const totalRaised = companyRounds
    .filter(r => r.status === 'closed')
    .reduce((sum, r) => sum + (r.raisedAmount || 0), 0);

  const lastValuation = latestRound?.postMoneyValuation || null;

  return {
    ...company,
    arr,
    runway,
    burnMultiple,
    daysSinceUpdate,
    companyAge,
    employeeCount,
    investorCount,
    latestRoundStage,
    totalRaised,
    lastValuation
  };
}

function deriveRoundL1(round, l0) {
  const now = Date.now();

  const coverage = (round.targetAmount || 0) > 0
    ? (round.raisedAmount || 0) / round.targetAmount
    : 0;

  const daysOpen = round.startedAt
    ? Math.floor((now - new Date(round.startedAt)) / 86400000)
    : 0;

  const daysToClose = round.targetCloseDate
    ? Math.floor((new Date(round.targetCloseDate) - now) / 86400000)
    : null;

  const fundraisingVelocity = daysOpen > 0
    ? (round.raisedAmount || 0) / daysOpen
    : 0;

  const commitments = l0.companyInvestors?.filter(ci =>
    ci.roundId === round.id
  ) || [];
  const commitmentCount = commitments.length;

  const hasLead = !!round.leadInvestorId;

  return {
    ...round,
    coverage,
    daysOpen,
    daysToClose,
    fundraisingVelocity,
    commitmentCount,
    hasLead
  };
}

function deriveGoalL1(goal, l0) {
  const now = Date.now();

  const progress = (goal.targetValue || 0) > 0
    ? (goal.currentValue || 0) / goal.targetValue
    : 0;

  const daysToDeadline = goal.targetDate
    ? Math.floor((new Date(goal.targetDate) - now) / 86400000)
    : null;

  const daysSinceStarted = goal.startDate
    ? Math.floor((now - new Date(goal.startDate)) / 86400000)
    : null;

  const progressVelocity = daysSinceStarted && daysSinceStarted > 0
    ? progress / daysSinceStarted
    : 0;

  const totalDuration = goal.startDate && goal.targetDate
    ? Math.floor((new Date(goal.targetDate) - new Date(goal.startDate)) / 86400000)
    : null;

  const timeElapsed = totalDuration && daysSinceStarted
    ? daysSinceStarted / totalDuration
    : null;

  const isOnTrack = timeElapsed !== null && timeElapsed > 0
    ? progress >= (timeElapsed * 0.9)
    : progress >= 0.5;

  const projectedCompletion = progressVelocity > 0 && progress < 1
    ? Math.ceil((1 - progress) / progressVelocity)
    : null;

  const daysSinceUpdate = goal.lastUpdatedAt
    ? Math.floor((now - new Date(goal.lastUpdatedAt)) / 86400000)
    : null;

  return {
    ...goal,
    progress,
    daysToDeadline,
    daysSinceStarted,
    progressVelocity,
    timeElapsed,
    isOnTrack,
    projectedCompletion,
    daysSinceUpdate
  };
}

function deriveInvestorL1(investor, l0) {
  const investments = l0.companyInvestors?.filter(ci =>
    ci.investorId === investor.id
  ) || [];

  const portfolioCompanyCount = new Set(investments.map(i => i.companyId)).size;
  const totalInvested = investments.reduce((sum, i) => sum + (i.commitment || 0), 0);

  const lastInteraction = investor.lastContactAt
    ? Math.floor((Date.now() - new Date(investor.lastContactAt)) / 86400000)
    : null;

  return {
    ...investor,
    portfolioCompanyCount,
    totalInvested,
    lastInteraction
  };
}

function computeL2Trajectories(l1) {
  const companies = l1.companies.map(c => deriveCompanyL2(c, l1));
  const rounds = l1.rounds.map(r => deriveRoundL2(r, l1));
  const goals = l1.goals.map(g => deriveGoalL2(g, l1));

  return { ...l1, companies, rounds, goals };
}

function deriveCompanyL2(company, l1) {
  const runwayProjection = company.runway !== null && company.runway < 12
    ? {
        criticalDate: new Date(Date.now() + company.runway * 30 * 86400000),
        daysUntilCritical: Math.floor(company.runway * 30),
        severity: company.runway < 3 ? 'critical' : company.runway < 6 ? 'high' : 'medium'
      }
    : null;

  const revenueGrowthTrend = company.previousMrr && company.mrr
    ? (company.mrr - company.previousMrr) / company.previousMrr
    : null;

  const burnTrend = company.previousMonthlyBurn && company.monthlyBurn
    ? company.monthlyBurn > company.previousMonthlyBurn ? 'increasing' : 'decreasing'
    : 'stable';

  const capitalEfficiencyTrend = company.burnMultiple !== null
    ? company.burnMultiple < 1.5 ? 'excellent' :
      company.burnMultiple < 3 ? 'good' :
      company.burnMultiple < 5 ? 'concerning' : 'critical'
    : null;

  const arrGrowthTrajectory = revenueGrowthTrend !== null && revenueGrowthTrend > 0
    ? {
        monthlyGrowthRate: revenueGrowthTrend,
        projectedArr12Months: company.arr * Math.pow(1 + revenueGrowthTrend, 12),
        compoundedGrowth: revenueGrowthTrend * 12
      }
    : null;

  const teamGrowthTrend = company.employeeCount > 0 && company.previousEmployeeCount
    ? company.employeeCount - company.previousEmployeeCount
    : 0;

  const marketMomentum = company.daysSinceUpdate !== null && company.daysSinceUpdate < 7
    ? 'active'
    : company.daysSinceUpdate < 14
    ? 'moderate'
    : 'stale';

  return {
    ...company,
    runwayProjection,
    revenueGrowthTrend,
    burnTrend,
    capitalEfficiencyTrend,
    arrGrowthTrajectory,
    teamGrowthTrend,
    marketMomentum
  };
}

function deriveRoundL2(round, l1) {
  const fundraisingMomentum = round.daysOpen > 0 && round.fundraisingVelocity > 0
    ? round.fundraisingVelocity > (round.targetAmount / 90) ? 'strong' :
      round.fundraisingVelocity > (round.targetAmount / 180) ? 'moderate' : 'weak'
    : 'none';

  const projectedClose = round.fundraisingVelocity > 0 && round.coverage < 1
    ? {
        daysToFull: Math.ceil((round.targetAmount - round.raisedAmount) / round.fundraisingVelocity),
        projectedCloseDate: new Date(Date.now() + Math.ceil((round.targetAmount - round.raisedAmount) / round.fundraisingVelocity) * 86400000),
        onTarget: round.daysToClose !== null && Math.ceil((round.targetAmount - round.raisedAmount) / round.fundraisingVelocity) <= round.daysToClose
      }
    : null;

  const investorInterestTrend = round.commitmentCount > 5 ? 'high' :
    round.commitmentCount > 2 ? 'moderate' : 'low';

  const timingHealth = round.daysOpen < 60 ? 'healthy' :
    round.daysOpen < 120 ? 'concerning' : 'critical';

  return {
    ...round,
    fundraisingMomentum,
    projectedClose,
    investorInterestTrend,
    timingHealth
  };
}

function deriveGoalL2(goal, l1) {
  const completionTrend = goal.isOnTrack ? 'on-track' :
    goal.progress > 0.3 && goal.daysToDeadline !== null && goal.daysToDeadline > 30 ? 'recoverable' :
    'at-risk';

  const projectedOutcome = goal.progressVelocity > 0 && goal.projectedCompletion !== null
    ? {
        willComplete: goal.daysToDeadline !== null && goal.projectedCompletion <= goal.daysToDeadline,
        projectedDate: new Date(Date.now() + goal.projectedCompletion * 86400000),
        daysOverdue: goal.daysToDeadline !== null ? Math.max(0, goal.projectedCompletion - goal.daysToDeadline) : 0
      }
    : null;

  const momentumHealth = goal.progressVelocity > 0.01 ? 'strong' :
    goal.progressVelocity > 0.005 ? 'moderate' :
    goal.progressVelocity > 0 ? 'weak' : 'stalled';

  return {
    ...goal,
    completionTrend,
    projectedOutcome,
    momentumHealth
  };
}

function computeL3Health(l2) {
  const companies = l2.companies.map(c => deriveCompanyL3Health(c, l2));
  const rounds = l2.rounds.map(r => deriveRoundL3Health(r, l2));
  const goals = l2.goals.map(g => deriveGoalL3Health(g, l2));

  const portfolioHealth = calculatePortfolioHealth(companies);

  return { ...l2, companies, rounds, goals, portfolioHealth };
}

function deriveCompanyL3Health(company, l2) {
  let capitalHealth = 100;
  if (company.runway !== null) {
    if (company.runway < 3) capitalHealth = 20;
    else if (company.runway < 6) capitalHealth = 50;
    else if (company.runway < 9) capitalHealth = 75;
    else capitalHealth = 95;
  }

  let revenueHealth = 100;
  if (company.arr === 0) {
    revenueHealth = 30;
  } else if (company.revenueGrowthTrend !== null) {
    if (company.revenueGrowthTrend < 0) revenueHealth = 40;
    else if (company.revenueGrowthTrend < 0.05) revenueHealth = 60;
    else if (company.revenueGrowthTrend < 0.15) revenueHealth = 80;
    else revenueHealth = 95;
  }

  let operationalHealth = 100;
  if (company.burnMultiple !== null) {
    if (company.burnMultiple > 5) operationalHealth = 30;
    else if (company.burnMultiple > 3) operationalHealth = 60;
    else if (company.burnMultiple > 1.5) operationalHealth = 80;
    else operationalHealth = 95;
  }

  let teamHealth = 100;
  if (company.employeeCount === 0) {
    teamHealth = 50;
  } else if (company.teamGrowthTrend < -2) {
    teamHealth = 40;
  } else if (company.teamGrowthTrend < 0) {
    teamHealth = 70;
  } else if (company.teamGrowthTrend > 5) {
    teamHealth = 95;
  } else {
    teamHealth = 85;
  }

  let engagementHealth = 100;
  if (company.daysSinceUpdate !== null) {
    if (company.daysSinceUpdate > 30) engagementHealth = 30;
    else if (company.daysSinceUpdate > 14) engagementHealth = 60;
    else if (company.daysSinceUpdate > 7) engagementHealth = 85;
    else engagementHealth = 100;
  }

  const overallHealth = Math.round(
    (capitalHealth * 0.30) +
    (revenueHealth * 0.25) +
    (operationalHealth * 0.20) +
    (teamHealth * 0.15) +
    (engagementHealth * 0.10)
  );

  return {
    ...company,
    capitalHealth,
    revenueHealth,
    operationalHealth,
    teamHealth,
    engagementHealth,
    overallHealth
  };
}

function deriveRoundL3Health(round, l2) {
  let fundraisingHealth = 100;
  if (round.coverage < 0.2 && round.daysOpen > 60) {
    fundraisingHealth = 20;
  } else if (round.coverage < 0.5 && round.daysOpen > 90) {
    fundraisingHealth = 40;
  } else if (round.coverage < 0.7) {
    fundraisingHealth = 70;
  } else if (round.coverage >= 1) {
    fundraisingHealth = 100;
  } else {
    fundraisingHealth = 85;
  }

  let timingHealth = 100;
  if (round.daysOpen > 180) timingHealth = 20;
  else if (round.daysOpen > 120) timingHealth = 50;
  else if (round.daysOpen > 90) timingHealth = 75;
  else timingHealth = 95;

  let momentumHealth = 100;
  if (round.fundraisingMomentum === 'none') momentumHealth = 0;
  else if (round.fundraisingMomentum === 'weak') momentumHealth = 40;
  else if (round.fundraisingMomentum === 'moderate') momentumHealth = 70;
  else momentumHealth = 95;

  const overallHealth = Math.round(
    (fundraisingHealth * 0.4) +
    (timingHealth * 0.3) +
    (momentumHealth * 0.3)
  );

  return {
    ...round,
    fundraisingHealth,
    timingHealth: timingHealth,
    momentumHealth: momentumHealth,
    overallHealth
  };
}

function deriveGoalL3Health(goal, l2) {
  let progressHealth = 100;
  if (goal.progress >= 1) {
    progressHealth = 100;
  } else if (goal.timeElapsed !== null && goal.timeElapsed > 0) {
    const expectedProgress = goal.timeElapsed;
    if (goal.progress >= expectedProgress * 0.9) progressHealth = 95;
    else if (goal.progress >= expectedProgress * 0.7) progressHealth = 75;
    else if (goal.progress >= expectedProgress * 0.5) progressHealth = 50;
    else progressHealth = 30;
  } else if (goal.progress > 0.7) {
    progressHealth = 80;
  } else if (goal.progress > 0.3) {
    progressHealth = 60;
  } else {
    progressHealth = 40;
  }

  let momentumHealth = 100;
  if (goal.momentumHealth === 'stalled') momentumHealth = 20;
  else if (goal.momentumHealth === 'weak') momentumHealth = 50;
  else if (goal.momentumHealth === 'moderate') momentumHealth = 75;
  else momentumHealth = 95;

  let urgencyHealth = 100;
  if (goal.daysToDeadline !== null) {
    if (goal.daysToDeadline < 0) urgencyHealth = 0;
    else if (goal.daysToDeadline < 7) urgencyHealth = 30;
    else if (goal.daysToDeadline < 30) urgencyHealth = 60;
    else urgencyHealth = 90;
  }

  const overallHealth = Math.round(
    (progressHealth * 0.5) +
    (momentumHealth * 0.3) +
    (urgencyHealth * 0.2)
  );

  return {
    ...goal,
    progressHealth,
    momentumHealth: momentumHealth,
    urgencyHealth,
    overallHealth
  };
}

function calculatePortfolioHealth(companies) {
  const portfolioCompanies = companies.filter(c => c.isPortfolio);

  if (portfolioCompanies.length === 0) {
    return { overall: 100, count: 0, breakdown: {} };
  }

  const avgHealth = portfolioCompanies.reduce((sum, c) => sum + (c.overallHealth || 50), 0) / portfolioCompanies.length;

  const healthDistribution = {
    excellent: portfolioCompanies.filter(c => c.overallHealth >= 85).length,
    good: portfolioCompanies.filter(c => c.overallHealth >= 70 && c.overallHealth < 85).length,
    fair: portfolioCompanies.filter(c => c.overallHealth >= 50 && c.overallHealth < 70).length,
    poor: portfolioCompanies.filter(c => c.overallHealth >= 30 && c.overallHealth < 50).length,
    critical: portfolioCompanies.filter(c => c.overallHealth < 30).length
  };

  return {
    overall: Math.round(avgHealth),
    count: portfolioCompanies.length,
    breakdown: healthDistribution
  };
}

function computeL4Issues(l3, resolvedPriorities) {
  const issues = [];
  let issueId = 1;

  const isResolved = (entityId, entityType, issueCategory, issueTitle) => {
    return resolvedPriorities.some(r =>
      r.entity_id === entityId &&
      r.entity_type === entityType &&
      r.issue_category === issueCategory &&
      r.issue_title === issueTitle &&
      r.status === 'resolved'
    );
  };

  for (const company of l3.companies) {
    if (!company.isPortfolio) continue;

    if (company.runway !== null && company.runway < 6) {
      const severity = company.runway < 3 ? 'critical' : 'high';
      const title = `Runway at ${company.runway.toFixed(1)} months`;
      const category = 'capital_sufficiency';
      if (!isResolved(company.id, 'company', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: company.id,
          entityType: 'company',
          entityName: company.name,
          category,
          severity,
          urgencyScore: Math.round(100 - (company.runway * 15)),
          title,
          description: `${company.name} has ${company.runway.toFixed(1)} months of runway remaining`,
          suggestedAction: company.runway < 3 ? 'Emergency bridge or accelerate close' : 'Review fundraising timeline',
          triggerCondition: `runway=${company.runway.toFixed(1)} < 6`,
          impact: 'high',
          effortEstimate: 'high'
        });
      }
    }

    if (company.burnMultiple !== null && company.burnMultiple > 3) {
      const title = `Burn multiple at ${company.burnMultiple.toFixed(1)}x`;
      const category = 'revenue_viability';
      if (!isResolved(company.id, 'company', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: company.id,
          entityType: 'company',
          entityName: company.name,
          category,
          severity: company.burnMultiple > 5 ? 'high' : 'medium',
          urgencyScore: Math.round(Math.min(company.burnMultiple * 15, 90)),
          title,
          description: `${company.name} burning ${company.burnMultiple.toFixed(1)}x MRR`,
          suggestedAction: 'Review unit economics and path to efficiency',
          triggerCondition: `burnMultiple=${company.burnMultiple.toFixed(1)} > 3`,
          impact: 'medium',
          effortEstimate: 'high'
        });
      }
    }

    if (company.revenueGrowthTrend !== null && company.revenueGrowthTrend < 0) {
      const title = `Negative revenue growth: ${(company.revenueGrowthTrend * 100).toFixed(1)}%`;
      const category = 'revenue_viability';
      if (!isResolved(company.id, 'company', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: company.id,
          entityType: 'company',
          entityName: company.name,
          category,
          severity: 'high',
          urgencyScore: 75,
          title,
          description: `${company.name} experiencing revenue decline`,
          suggestedAction: 'Investigate churn, sales pipeline, and market fit',
          triggerCondition: `revenueGrowthTrend=${(company.revenueGrowthTrend * 100).toFixed(1)}% < 0`,
          impact: 'high',
          effortEstimate: 'medium'
        });
      }
    }

    if (company.daysSinceUpdate !== null && company.daysSinceUpdate > 14) {
      const title = `No update in ${company.daysSinceUpdate} days`;
      const category = 'attention_misallocation';
      if (!isResolved(company.id, 'company', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: company.id,
          entityType: 'company',
          entityName: company.name,
          category,
          severity: company.daysSinceUpdate > 30 ? 'high' : 'medium',
          urgencyScore: Math.round(Math.min(company.daysSinceUpdate * 2, 80)),
          title,
          description: `${company.name} has not provided update recently`,
          suggestedAction: 'Schedule check-in',
          triggerCondition: `daysSinceUpdate=${company.daysSinceUpdate} > 14`,
          impact: 'low',
          effortEstimate: 'low'
        });
      }
    }

    if (company.teamGrowthTrend < -2) {
      const title = `Team shrinking: ${Math.abs(company.teamGrowthTrend)} employees lost`;
      const category = 'talent_gaps';
      if (!isResolved(company.id, 'company', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: company.id,
          entityType: 'company',
          entityName: company.name,
          category,
          severity: 'high',
          urgencyScore: 70,
          title,
          description: `${company.name} experiencing high turnover`,
          suggestedAction: 'Investigate retention issues and culture',
          triggerCondition: `teamGrowthTrend=${company.teamGrowthTrend} < -2`,
          impact: 'high',
          effortEstimate: 'high'
        });
      }
    }
  }

  for (const round of l3.rounds) {
    if (round.status !== 'active' && round.status !== 'closing') continue;
    const company = l3.companies.find(c => c.id === round.companyId);
    if (!company?.isPortfolio) continue;

    if (round.daysOpen > 45 && round.coverage < 0.3) {
      const title = `${round.roundType} open ${round.daysOpen}d, ${(round.coverage * 100).toFixed(0)}% covered`;
      const category = 'capital_sufficiency';
      if (!isResolved(round.id, 'round', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: round.id,
          entityType: 'round',
          entityName: `${company.name} - ${round.roundType}`,
          category,
          severity: 'high',
          urgencyScore: Math.round(60 + round.daysOpen * 0.5),
          title,
          description: `${company.name} ${round.roundType} fundraise stalled`,
          suggestedAction: 'Assess pipeline, consider repositioning',
          triggerCondition: `daysOpen=${round.daysOpen} > 45 && coverage < 0.3`,
          impact: 'high',
          effortEstimate: 'medium'
        });
      }
    }

    if (!round.hasLead && round.daysOpen > 30) {
      const title = `${round.roundType} needs lead, ${round.daysOpen}d open`;
      const category = 'market_access';
      if (!isResolved(round.id, 'round', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: round.id,
          entityType: 'round',
          entityName: `${company.name} - ${round.roundType}`,
          category,
          severity: 'medium',
          urgencyScore: Math.round(40 + round.daysOpen * 0.3),
          title,
          description: `${company.name} ${round.roundType} missing lead investor`,
          suggestedAction: 'Focus on lead-capable firms',
          triggerCondition: `hasLead=false && daysOpen=${round.daysOpen} > 30`,
          impact: 'high',
          effortEstimate: 'high'
        });
      }
    }

    if (round.fundraisingMomentum === 'weak' || round.fundraisingMomentum === 'none') {
      const title = `${round.roundType} fundraising momentum ${round.fundraisingMomentum}`;
      const category = 'market_access';
      if (!isResolved(round.id, 'round', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: round.id,
          entityType: 'round',
          entityName: `${company.name} - ${round.roundType}`,
          category,
          severity: 'medium',
          urgencyScore: 60,
          title,
          description: `${company.name} ${round.roundType} showing weak investor interest`,
          suggestedAction: 'Reassess positioning, narrative, and target investors',
          triggerCondition: `fundraisingMomentum=${round.fundraisingMomentum}`,
          impact: 'medium',
          effortEstimate: 'medium'
        });
      }
    }
  }

  for (const goal of l3.goals) {
    const company = l3.companies.find(c => c.id === goal.companyId);
    if (!company?.isPortfolio) continue;

    if (goal.progress < 1 && goal.daysToDeadline !== null && goal.daysToDeadline < 30 && goal.progress < 0.7) {
      const title = `${goal.title}: ${(goal.progress * 100).toFixed(0)}% complete, ${goal.daysToDeadline}d left`;
      const category = 'goal_risk';
      if (!isResolved(goal.id, 'goal', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: goal.id,
          entityType: 'goal',
          entityName: `${company.name} - ${goal.title}`,
          category,
          severity: goal.daysToDeadline < 0 ? 'high' : goal.progress < 0.3 ? 'high' : 'medium',
          urgencyScore: Math.round(50 + (1 - goal.progress) * 30 + Math.max(0, 30 - goal.daysToDeadline)),
          title,
          description: `${company.name} goal at risk of missing deadline`,
          suggestedAction: 'Review blockers and acceleration options',
          triggerCondition: `progress=${(goal.progress * 100).toFixed(0)}% < 70% && daysToDeadline=${goal.daysToDeadline} < 30`,
          impact: 'medium',
          effortEstimate: 'medium'
        });
      }
    }

    if (goal.progress < 1 && goal.daysSinceUpdate !== null && goal.daysSinceUpdate > 21) {
      const title = `${goal.title}: No update in ${goal.daysSinceUpdate} days`;
      const category = 'goal_risk';
      if (!isResolved(goal.id, 'goal', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: goal.id,
          entityType: 'goal',
          entityName: `${company.name} - ${goal.title}`,
          category,
          severity: 'medium',
          urgencyScore: Math.round(40 + goal.daysSinceUpdate),
          title,
          description: `${company.name} goal appears stalled`,
          suggestedAction: 'Check in on progress and blockers',
          triggerCondition: `daysSinceUpdate=${goal.daysSinceUpdate} > 21`,
          impact: 'low',
          effortEstimate: 'low'
        });
      }
    }

    if (goal.completionTrend === 'at-risk' && goal.progress < 0.5) {
      const title = `${goal.title}: At risk, ${(goal.progress * 100).toFixed(0)}% complete`;
      const category = 'execution_risk';
      if (!isResolved(goal.id, 'goal', category, title)) {
        issues.push({
          id: `issue-${issueId++}`,
          entityId: goal.id,
          entityType: 'goal',
          entityName: `${company.name} - ${goal.title}`,
          category,
          severity: 'high',
          urgencyScore: 75,
          title,
          description: `${company.name} goal significantly behind schedule`,
          suggestedAction: 'Escalate to founder, identify critical blockers',
          triggerCondition: `completionTrend=at-risk && progress=${(goal.progress * 100).toFixed(0)}% < 50%`,
          impact: 'high',
          effortEstimate: 'medium'
        });
      }
    }
  }

  return { ...l3, issues };
}

function computeL5Priorities(l4) {
  const priorities = l4.issues.map(issue => {
    const resolution = getResolutionTemplate(issue);

    const impactScore = calculateImpact(issue, l4);
    const effortScore = estimateEffort(issue);
    const priorityScore = (issue.urgencyScore * 0.5) + (impactScore * 0.3) + ((100 - effortScore) * 0.2);

    return {
      ...issue,
      impactScore,
      effortScore,
      priorityScore: Math.round(priorityScore),
      resolutionTemplate: resolution.template,
      resolutionSteps: resolution.steps,
      dependencies: resolution.dependencies,
      cascadeEffect: resolution.cascadeEffect
    };
  });

  priorities.sort((a, b) => b.priorityScore - a.priorityScore);

  return { ...l4, priorities };
}

function getResolutionTemplate(issue) {
  const templates = {
    'capital_sufficiency_runway': {
      template: 'Emergency Capital Extension',
      steps: [
        'Assess immediate cash needs and burn rate',
        'Identify bridge financing options (existing investors, revenue-based financing, venture debt)',
        'Prepare emergency deck with updated metrics and timeline',
        'Reach out to committed investors for emergency bridge',
        'If needed, implement cost reduction measures',
        'Accelerate current fundraising close'
      ],
      dependencies: ['Updated financial model', 'Board alignment'],
      cascadeEffect: 'Prevents shutdown, enables continued operations'
    },
    'capital_sufficiency_stalled': {
      template: 'Reposition Fundraise',
      steps: [
        'Analyze why fundraise stalled (market, narrative, valuation, traction)',
        'Gather honest feedback from passed investors',
        'Revise positioning and narrative based on feedback',
        'Update pitch deck with stronger traction proof points',
        'Identify new investor segments to target',
        'Relaunch with refreshed approach'
      ],
      dependencies: ['Investor feedback', 'Updated metrics'],
      cascadeEffect: 'Unlocks capital, extends runway, enables growth'
    },
    'revenue_viability_burn': {
      template: 'Unit Economics Review',
      steps: [
        'Calculate true unit economics (CAC, LTV, gross margin)',
        'Identify primary drivers of burn inefficiency',
        'Model path to capital efficiency milestones',
        'Present findings to founder with recommendations',
        'Implement quick wins to improve burn multiple',
        'Set target metrics and monthly review cadence'
      ],
      dependencies: ['Detailed P&L', 'Cohort analysis'],
      cascadeEffect: 'Improves capital efficiency, extends runway, increases fundability'
    },
    'revenue_viability_growth': {
      template: 'Growth Recovery Plan',
      steps: [
        'Diagnose root cause (churn, sales velocity, market fit)',
        'Analyze cohort retention and expansion metrics',
        'Review sales pipeline and conversion rates',
        'Interview churned customers for feedback',
        'Develop action plan targeting root causes',
        'Implement and track weekly metrics'
      ],
      dependencies: ['Customer data', 'Sales pipeline data'],
      cascadeEffect: 'Restores growth trajectory, improves fundability, increases valuation'
    },
    'market_access_lead': {
      template: 'Lead Investor Hunt',
      steps: [
        'List all lead-capable firms in stage/sector',
        'Prioritize by fit, relationship, and conviction potential',
        'Craft lead-specific narrative and deck',
        'Leverage warm intros from existing investors/advisors',
        'Run tight process with urgency and FOMO',
        'Close lead, then fill round quickly'
      ],
      dependencies: ['Strong existing investor relationships', 'Compelling narrative'],
      cascadeEffect: 'Unlocks round close, validates valuation, attracts followers'
    },
    'market_access_momentum': {
      template: 'Rebuild Fundraising Momentum',
      steps: [
        'Assess current investor pipeline stage distribution',
        'Identify sticking points causing drop-off',
        'Add 20+ new qualified prospects to top of funnel',
        'Accelerate meeting cadence to create urgency',
        'Manufacture FOMO through visible progress',
        'Convert momentum into term sheets'
      ],
      dependencies: ['Investor pipeline CRM', 'Warm intro sources'],
      cascadeEffect: 'Creates competitive pressure, improves terms, accelerates close'
    },
    'talent_gaps_turnover': {
      template: 'Retention Investigation',
      steps: [
        'Conduct exit interviews with recent departures',
        'Survey current team on satisfaction and concerns',
        'Identify systemic issues (comp, culture, leadership)',
        'Present findings to founder confidentially',
        'Develop retention plan with quick wins',
        'Monitor turnover trend monthly'
      ],
      dependencies: ['Trust with founder', 'Access to team'],
      cascadeEffect: 'Stabilizes team, preserves institutional knowledge, improves morale'
    },
    'attention_misallocation_update': {
      template: 'Schedule Check-in',
      steps: [
        'Send WhatsApp/email requesting 30min sync',
        'Prepare specific questions on metrics and blockers',
        'Conduct call with active listening',
        'Identify any emerging issues or needs',
        'Document key updates in CRM',
        'Schedule next touchpoint'
      ],
      dependencies: ['Founder availability'],
      cascadeEffect: 'Surfaces hidden issues, maintains relationship, enables proactive support'
    },
    'goal_risk_deadline': {
      template: 'Goal Acceleration',
      steps: [
        'Review goal progress and current blockers',
        'Identify if deadline is realistic or needs revision',
        'Brainstorm acceleration tactics with founder',
        'Assign ownership and accountability',
        'Remove blockers within your control',
        'Weekly check-ins until completion or deadline'
      ],
      dependencies: ['Founder commitment', 'Clear blockers'],
      cascadeEffect: 'Achieves milestone, builds momentum, proves execution'
    },
    'goal_risk_stalled': {
      template: 'Goal Unblock',
      steps: [
        'Identify why goal is stalled (attention, resources, clarity)',
        'Determine if goal is still relevant/valuable',
        'If relevant: create unblock plan with founder',
        'If not relevant: archive goal to reduce noise',
        'Implement unblock actions',
        'Restart progress tracking'
      ],
      dependencies: ['Founder prioritization'],
      cascadeEffect: 'Restarts progress, clears dead goals, focuses attention'
    },
    'execution_risk_behind': {
      template: 'Milestone Recovery',
      steps: [
        'Assess severity and impact of being behind',
        'Identify critical path to catch up',
        'Determine if additional resources can accelerate',
        'Escalate to founder with urgency',
        'Provide specific support (intros, advice, hands-on help)',
        'Track daily/weekly until back on track'
      ],
      dependencies: ['Founder urgency', 'Resource availability'],
      cascadeEffect: 'Recovers milestone, preserves credibility, maintains fundraising timeline'
    }
  };

  const key = `${issue.category}_${issue.severity === 'critical' || issue.category === 'capital_sufficiency' && issue.urgencyScore > 80 ? 'runway' :
    issue.title.includes('stalled') || issue.title.includes('open') ? 'stalled' :
    issue.title.includes('multiple') ? 'burn' :
    issue.title.includes('growth') ? 'growth' :
    issue.title.includes('lead') ? 'lead' :
    issue.title.includes('momentum') ? 'momentum' :
    issue.title.includes('turnover') || issue.title.includes('shrinking') ? 'turnover' :
    issue.title.includes('No update') ? 'update' :
    issue.daysToDeadline !== undefined && issue.daysToDeadline < 30 ? 'deadline' :
    issue.title.includes('stalled') ? 'stalled' :
    'behind'}`;

  return templates[key] || {
    template: 'Generic Resolution',
    steps: [
      'Assess situation thoroughly',
      'Identify root cause',
      'Develop action plan',
      'Execute with urgency',
      'Track progress',
      'Adjust as needed'
    ],
    dependencies: ['Information', 'Resources'],
    cascadeEffect: 'Resolves issue'
  };
}

function calculateImpact(issue, l4) {
  let impact = 50;

  if (issue.category === 'capital_sufficiency') {
    impact = 95;
  } else if (issue.category === 'revenue_viability') {
    impact = 85;
  } else if (issue.category === 'market_access') {
    impact = 80;
  } else if (issue.category === 'execution_risk') {
    impact = 70;
  } else if (issue.category === 'talent_gaps') {
    impact = 65;
  } else if (issue.category === 'goal_risk') {
    impact = 55;
  } else if (issue.category === 'attention_misallocation') {
    impact = 30;
  }

  if (issue.severity === 'critical') impact = Math.min(100, impact + 20);
  if (issue.severity === 'high') impact = Math.min(100, impact + 10);

  const company = l4.companies.find(c => c.id === issue.entityId ||
    (issue.entityType === 'round' && l4.rounds.find(r => r.id === issue.entityId)?.companyId === c.id) ||
    (issue.entityType === 'goal' && l4.goals.find(g => g.id === issue.entityId)?.companyId === c.id)
  );

  if (company?.overallHealth < 50) {
    impact = Math.min(100, impact + 15);
  }

  return Math.round(impact);
}

function estimateEffort(issue) {
  const effortMap = {
    'Schedule check-in': 20,
    'Check in on progress': 20,
    'Review blockers': 40,
    'Review fundraising timeline': 50,
    'Focus on lead-capable firms': 70,
    'Assess pipeline': 60,
    'Review unit economics': 60,
    'Investigate churn': 70,
    'Emergency bridge': 90,
    'Investigate retention issues': 80
  };

  for (const [action, effort] of Object.entries(effortMap)) {
    if (issue.suggestedAction.includes(action)) {
      return effort;
    }
  }

  if (issue.severity === 'critical') return 90;
  if (issue.severity === 'high') return 70;
  if (issue.severity === 'medium') return 50;
  return 30;
}

function computeL6Output(l5) {
  const topPriorities = l5.priorities.slice(0, 20);

  const groupedByEntity = topPriorities.reduce((acc, p) => {
    const key = p.entityId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const groupedByCategory = topPriorities.reduce((acc, p) => {
    const key = p.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const summary = {
    totalPriorities: l5.priorities.length,
    criticalCount: l5.priorities.filter(p => p.severity === 'critical').length,
    highCount: l5.priorities.filter(p => p.severity === 'high').length,
    mediumCount: l5.priorities.filter(p => p.severity === 'medium').length,
    avgPriorityScore: Math.round(l5.priorities.reduce((sum, p) => sum + p.priorityScore, 0) / l5.priorities.length),
    topCategories: Object.keys(groupedByCategory)
      .map(cat => ({ category: cat, count: groupedByCategory[cat].length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  };

  return {
    ...l5,
    topPriorities,
    groupedByEntity,
    groupedByCategory,
    summary
  };
}

export function deriveCompanyMetrics(company) {
  return deriveCompanyL1(company, { companies: [], rounds: [], goals: [], investors: [], companyInvestors: [], talent: [], employees: [] });
}

export function deriveRoundMetrics(round) {
  return deriveRoundL1(round, { companies: [], rounds: [], goals: [], investors: [], companyInvestors: [], talent: [], employees: [] });
}

export function deriveGoalMetrics(goal) {
  return deriveGoalL1(goal, { companies: [], rounds: [], goals: [], investors: [], companyInvestors: [], talent: [], employees: [] });
}

export function detectIssues(companies, rounds, goals, resolvedPriorities = []) {
  const rawData = { companies, rounds, goals, investors: [], companyInvestors: [], talent: [], employees: [] };
  const result = computeAllDerivations(rawData, resolvedPriorities);
  return result.l4.issues;
}

export function calculateHealth(company, issues) {
  const companyIssues = issues.filter(i => i.entityId === company.id);
  let healthScore = 100;
  for (const issue of companyIssues) {
    const penalty = issue.severity === 'critical' ? 25 : issue.severity === 'high' ? 15 : issue.severity === 'medium' ? 8 : 3;
    healthScore -= penalty;
  }
  return Math.max(0, Math.min(100, healthScore));
}
