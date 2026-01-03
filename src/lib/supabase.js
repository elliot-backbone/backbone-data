import { createClient } from '@supabase/supabase-js';
import { deriveCompanyMetrics, deriveRoundMetrics, deriveGoalMetrics } from './derivations';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function markPriorityResolved(companyId, issueCategory, issueTitle, notes = null) {
  const { data, error } = await supabase
    .from('priority_resolutions')
    .insert([
      {
        company_id: companyId,
        issue_category: issueCategory,
        issue_title: issueTitle,
        resolution_notes: notes,
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error marking priority as resolved:', error);
    throw error;
  }

  return data;
}

export async function getResolvedPriorities() {
  const { data, error } = await supabase
    .from('priority_resolutions')
    .select('*')
    .order('resolved_at', { ascending: false });

  if (error) {
    console.error('Error fetching resolved priorities:', error);
    throw error;
  }

  return data || [];
}

export async function unresolveIssue(companyId, issueCategory, issueTitle) {
  const { error } = await supabase
    .from('priority_resolutions')
    .delete()
    .eq('company_id', companyId)
    .eq('issue_category', issueCategory)
    .eq('issue_title', issueTitle);

  if (error) {
    console.error('Error unresolving priority:', error);
    throw error;
  }
}

export async function loadAllData() {
  const [
    { data: companies, error: companiesError },
    { data: people, error: peopleError },
    { data: firms, error: firmsError },
    { data: rounds, error: roundsError },
    { data: goals, error: goalsError },
    { data: deals, error: dealsError }
  ] = await Promise.all([
    supabase.from('companies').select('*'),
    supabase.from('people').select('*'),
    supabase.from('firms').select('*'),
    supabase.from('rounds').select('*'),
    supabase.from('goals').select('*'),
    supabase.from('deals').select('*')
  ]);

  if (companiesError) console.error('Error loading companies:', companiesError);
  if (peopleError) console.error('Error loading people:', peopleError);
  if (firmsError) console.error('Error loading firms:', firmsError);
  if (roundsError) console.error('Error loading rounds:', roundsError);
  if (goalsError) console.error('Error loading goals:', goalsError);
  if (dealsError) console.error('Error loading deals:', dealsError);

  return {
    companies: (companies || []).map(deriveCompanyMetrics),
    people: people || [],
    firms: firms || [],
    rounds: (rounds || []).map(deriveRoundMetrics),
    goals: (goals || []).map(deriveGoalMetrics),
    deals: deals || []
  };
}
