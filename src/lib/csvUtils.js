export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += char;
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((header, i) => {
      let val = values[i] || '';
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);
      obj[header] = val;
    });
    return obj;
  });
}

export function convertToCSV(data, columns) {
  if (!data || data.length === 0) return '';

  const headers = columns || Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

export async function fetchGoogleSheetsCSV(url) {
  let csvUrl = url;

  if (url.includes('/edit')) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const sheetId = match[1];
      let gid = '0';
      const gidMatch = url.match(/gid=([0-9]+)/);
      if (gidMatch) gid = gidMatch[1];
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
  }

  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error('Failed to fetch Google Sheet');

  const text = await response.text();
  return text;
}

export const CSV_TEMPLATES = {
  companies: {
    headers: 'name,is_portfolio,stage,sector,country,cash_on_hand,monthly_burn,mrr,employee_count,founded_at',
    example: 'Acme Corp,true,seed,fintech,US,500000,50000,10000,12,2023-01-15'
  },
  firms: {
    headers: 'name,firm_type,typical_check_min,typical_check_max',
    example: 'Sequoia Capital,vc,1000000,10000000'
  },
  people: {
    headers: 'first_name,last_name,email,role,title',
    example: 'John,Doe,john@example.com,founder,CEO'
  },
  rounds: {
    headers: 'round_type,target_amount,raised_amount,status,target_close_date',
    example: 'seed,2000000,1500000,active,2024-06-30'
  },
  goals: {
    headers: 'title,goal_type,target_value,current_value,target_date',
    example: 'Hit $50k MRR,revenue,50000,35000,2024-12-31'
  },
  deals: {
    headers: 'deal_stage,expected_amount,last_contact_date',
    example: 'diligence,250000,2024-01-15'
  }
};
