import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseCSV, convertToCSV, fetchGoogleSheetsCSV, CSV_TEMPLATES } from '../lib/csvUtils';
import './AdminImportExport.css';

export default function AdminImportExport() {
  const [googleSheetUrls, setGoogleSheetUrls] = useState({});
  const [csvTexts, setCsvTexts] = useState({});
  const [statuses, setStatuses] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});

  const entities = ['companies', 'people', 'firms', 'rounds', 'goals', 'deals'];

  async function handleImport(entity) {
    const csvText = csvTexts[entity];
    if (!csvText?.trim()) {
      setErrors({ ...errors, [entity]: 'Please paste CSV data' });
      return;
    }

    setLoading({ ...loading, [entity]: true });
    setErrors({ ...errors, [entity]: '' });
    setStatuses({ ...statuses, [entity]: '' });

    try {
      const data = parseCSV(csvText);
      if (data.length === 0) {
        setErrors({ ...errors, [entity]: 'No data found in CSV' });
        return;
      }

      const { error: insertError } = await supabase
        .from(entity)
        .insert(data);

      if (insertError) throw insertError;

      setStatuses({ ...statuses, [entity]: `Imported ${data.length} rows` });
      setCsvTexts({ ...csvTexts, [entity]: '' });
    } catch (err) {
      setErrors({ ...errors, [entity]: 'Import failed: ' + err.message });
    } finally {
      setLoading({ ...loading, [entity]: false });
    }
  }

  async function handleGoogleSheetsImport(entity) {
    const googleSheetUrl = googleSheetUrls[entity];
    if (!googleSheetUrl?.trim()) {
      setErrors({ ...errors, [entity]: 'Please enter a Google Sheets URL' });
      return;
    }

    setLoading({ ...loading, [entity]: true });
    setErrors({ ...errors, [entity]: '' });
    setStatuses({ ...statuses, [entity]: '' });

    try {
      const csvData = await fetchGoogleSheetsCSV(googleSheetUrl);
      const data = parseCSV(csvData);

      if (data.length === 0) {
        setErrors({ ...errors, [entity]: 'No data found in Google Sheet' });
        return;
      }

      const { error: insertError } = await supabase
        .from(entity)
        .insert(data);

      if (insertError) throw insertError;

      setStatuses({ ...statuses, [entity]: `Imported ${data.length} rows from Sheets` });
      setGoogleSheetUrls({ ...googleSheetUrls, [entity]: '' });
    } catch (err) {
      setErrors({ ...errors, [entity]: 'Sheets import failed: ' + err.message });
    } finally {
      setLoading({ ...loading, [entity]: false });
    }
  }

  async function handleExport(entity) {
    setLoading({ ...loading, [entity]: true });
    setErrors({ ...errors, [entity]: '' });
    setStatuses({ ...statuses, [entity]: '' });

    try {
      const { data, error: fetchError } = await supabase
        .from(entity)
        .select('*');

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setErrors({ ...errors, [entity]: 'No data to export' });
        return;
      }

      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatuses({ ...statuses, [entity]: `Exported ${data.length} rows` });
    } catch (err) {
      setErrors({ ...errors, [entity]: 'Export failed: ' + err.message });
    } finally {
      setLoading({ ...loading, [entity]: false });
    }
  }

  function handleFileUpload(entity, e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvTexts({ ...csvTexts, [entity]: event.target.result });
      setStatuses({ ...statuses, [entity]: 'File loaded' });
    };
    reader.readAsText(file);
  }

  return (
    <div className="admin-import-export">
      <div className="import-export-header">
        <h3>Import/Export Data</h3>
        <p>Manage data for all entity types</p>
      </div>

      <div className="entities-table">
        {entities.map(entity => {
          const template = CSV_TEMPLATES[entity];
          const isLoading = loading[entity];
          const status = statuses[entity];
          const error = errors[entity];

          return (
            <div key={entity} className="entity-row">
              <div className="entity-name-col">
                <h4>{entity}</h4>
                <div className="template-hint">
                  {template.headers.split(',').slice(0, 3).join(', ')}...
                </div>
              </div>

              <div className="entity-actions-col">
                <div className="action-group">
                  <input
                    type="text"
                    placeholder=""
                    className="sheets-url-compact"
                    value={googleSheetUrls[entity] || ''}
                    onChange={(e) => setGoogleSheetUrls({ ...googleSheetUrls, [entity]: e.target.value })}
                  />
                  <button
                    className="action-btn sheets-btn"
                    onClick={() => handleGoogleSheetsImport(entity)}
                    disabled={isLoading || !googleSheetUrls[entity]?.trim()}
                  >
                    Sheets
                  </button>
                </div>

                <div className="action-group">
                  <label className="file-upload-compact">
                    CSV
                    <input type="file" accept=".csv" onChange={(e) => handleFileUpload(entity, e)} />
                  </label>
                  {csvTexts[entity] && (
                    <button
                      className="action-btn import-btn-compact"
                      onClick={() => handleImport(entity)}
                      disabled={isLoading}
                    >
                      Import
                    </button>
                  )}
                </div>

                <div className="action-group">
                  <button
                    className="action-btn export-btn-compact"
                    onClick={() => handleExport(entity)}
                    disabled={isLoading}
                  >
                    Export
                  </button>
                </div>
              </div>

              {(status || error) && (
                <div className="entity-status">
                  {status && <span className="status-text success">{status}</span>}
                  {error && <span className="status-text error">{error}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
