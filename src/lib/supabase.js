import { createClient } from '@supabase/supabase-js';

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
