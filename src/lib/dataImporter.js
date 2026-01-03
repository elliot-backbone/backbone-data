import { supabase } from './supabase';
import { generateDataset } from './generator';

export async function clearAllData() {
  const { error: dealsError } = await supabase.from('deals').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  if (dealsError) throw new Error(`Failed to clear deals: ${dealsError.message}`);

  const { error: goalsError } = await supabase.from('goals').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  if (goalsError) throw new Error(`Failed to clear goals: ${goalsError.message}`);

  const { error: roundsError } = await supabase.from('rounds').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  if (roundsError) throw new Error(`Failed to clear rounds: ${roundsError.message}`);

  const { error: companiesError } = await supabase.from('companies').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  if (companiesError) throw new Error(`Failed to clear companies: ${companiesError.message}`);

  const { error: peopleError } = await supabase.from('people').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  if (peopleError) throw new Error(`Failed to clear people: ${peopleError.message}`);

  const { error: firmsError } = await supabase.from('firms').delete().gte('id', '00000000-0000-0000-0000-000000000000');
  if (firmsError) throw new Error(`Failed to clear firms: ${firmsError.message}`);
}

export async function importGeneratedData(portfolioCount = 12, stressLevel = 'default') {
  const data = generateDataset(portfolioCount, stressLevel);

  const firmsData = data.firms.map(f => ({
    id: f.id,
    name: f.name,
    firm_type: f.firmType,
    typical_check_min: f.typicalCheckMin,
    typical_check_max: f.typicalCheckMax,
  }));

  const { error: firmsError } = await supabase.from('firms').insert(firmsData);
  if (firmsError) throw new Error(`Failed to insert firms: ${firmsError.message}`);

  const peopleData = data.people.map(p => ({
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
    role: p.role,
    firm_id: p.firm_id,
    title: p.title,
    last_contacted_at: p.lastContactedAt,
  }));

  const { error: peopleError } = await supabase.from('people').insert(peopleData);
  if (peopleError) throw new Error(`Failed to insert people: ${peopleError.message}`);

  const companiesData = data.companies.map(c => ({
    id: c.id,
    name: c.name,
    is_portfolio: c.isPortfolio,
    founder_id: c.founder_id,
    founded_at: c.foundedAt,
    country: c.country,
    cash_on_hand: c.cashOnHand,
    monthly_burn: c.monthlyBurn,
    mrr: c.mrr,
    arr: c.arr,
    runway: c.runway,
    revenue_growth_rate: c.revenueGrowthRate,
    gross_margin: c.grossMargin,
    cac_payback: c.cacPayback,
    stage: c.stage,
    sector: c.sector,
    employee_count: c.employeeCount,
    last_material_update_at: c.lastMaterialUpdate_at,
  }));

  const { error: companiesError } = await supabase.from('companies').insert(companiesData);
  if (companiesError) throw new Error(`Failed to insert companies: ${companiesError.message}`);

  const roundsData = data.rounds.map(r => ({
    id: r.id,
    company_id: r.company_id,
    round_type: r.roundType,
    target_amount: r.targetAmount,
    raised_amount: r.raisedAmount,
    status: r.status,
    started_at: r.startedAt,
    target_close_date: r.targetCloseDate,
    actual_close_date: r.status === 'closed' ? r.closeDate : null,
    lead_investor_id: r.leadInvestor_id,
  }));

  const { error: roundsError } = await supabase.from('rounds').insert(roundsData);
  if (roundsError) throw new Error(`Failed to insert rounds: ${roundsError.message}`);

  const goalsData = data.goals.map(g => ({
    id: g.id,
    company_id: g.company_id,
    goal_type: g.goalType,
    title: g.title,
    target_value: g.targetValue,
    current_value: g.currentValue,
    start_date: g.startDate,
    target_date: g.targetDate,
    is_on_track: g.isOnTrack,
    last_updated_at: g.lastUpdatedAt,
  }));

  const { error: goalsError } = await supabase.from('goals').insert(goalsData);
  if (goalsError) throw new Error(`Failed to insert goals: ${goalsError.message}`);

  const dealsData = data.deals.map(d => ({
    id: d.id,
    round_id: d.round_id,
    firm_id: d.firm_id,
    person_id: d.person_id,
    deal_stage: d.dealStage,
    expected_amount: d.expectedAmount,
    last_contact_date: d.lastContactDate,
    introduced_by_id: d.introducedBy_id,
  }));

  const { error: dealsError } = await supabase.from('deals').insert(dealsData);
  if (dealsError) throw new Error(`Failed to insert deals: ${dealsError.message}`);

  return {
    firms: data.firms.length,
    people: data.people.length,
    companies: data.companies.length,
    rounds: data.rounds.length,
    goals: data.goals.length,
    deals: data.deals.length,
  };
}
