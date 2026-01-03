import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseCSV, convertToCSV, fetchGoogleSheetsCSV, CSV_TEMPLATES } from '../lib/csvUtils';
import './AdminImportExport.css';

export default function AdminImportExport() {
  const [activeEntity, setActiveEntity] = useState('companies');
  const [csvText, setCsvText] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const entities = ['companies', 'people', 'firms', 'rounds', 'goals', 'deals'];

  async function handleImport() {
    if (!csvText.trim()) {
      setError('Please paste CSV data');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const data = parseCSV(csvText);
      if (data.length === 0) {
        setError('No data found in CSV');
        return;
      }

      const { error: insertError } = await supabase
        .from(activeEntity)
        .insert(data);

      if (insertError) throw insertError;

      setStatus(`Successfully imported ${data.length} ${activeEntity}`);
      setCsvText('');
    } catch (err) {
      setError('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSheetsImport() {
    if (!googleSheetUrl.trim()) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('');

    try {
      const csvData = await fetchGoogleSheetsCSV(googleSheetUrl);
      const data = parseCSV(csvData);

      if (data.length === 0) {
        setError('No data found in Google Sheet');
        return;
      }

      const { error: insertError } = await supabase
        .from(activeEntity)
        .insert(data);

      if (insertError) throw insertError;

      setStatus(`Successfully imported ${data.length} ${activeEntity} from Google Sheets`);
      setGoogleSheetUrl('');
    } catch (err) {
      setError('Google Sheets import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const { data, error: fetchError } = await supabase
        .from(activeEntity)
        .select('*');

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setError('No data to export');
        return;
      }

      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeEntity}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus(`Exported ${data.length} ${activeEntity}`);
    } catch (err) {
      setError('Export failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
      setStatus('File loaded, click Import to upload to database');
    };
    reader.readAsText(file);
  }

  const template = CSV_TEMPLATES[activeEntity];

  return (
    <div className="admin-import-export">
      <div className="import-export-header">
        <h3>Import/Export Data</h3>
        <p>Import CSV data or export existing data for each entity type</p>
      </div>

      <div className="entity-tabs">
        {entities.map(entity => (
          <button
            key={entity}
            className={`entity-tab ${activeEntity === entity ? 'active' : ''}`}
            onClick={() => {
              setActiveEntity(entity);
              setCsvText('');
              setGoogleSheetUrl('');
              setError('');
              setStatus('');
            }}
          >
            {entity}
          </button>
        ))}
      </div>

      <div className="import-export-content">
        <div className="section">
          <h4>Import from Google Sheets</h4>
          <p className="help-text">
            Paste a Google Sheets URL (must be publicly accessible or shared with link viewing enabled)
          </p>
          <input
            type="text"
            value={googleSheetUrl}
            onChange={(e) => setGoogleSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="sheets-url-input"
          />
          <button
            className="import-btn"
            onClick={handleGoogleSheetsImport}
            disabled={loading || !googleSheetUrl.trim()}
          >
            {loading ? 'Importing...' : 'Import from Google Sheets'}
          </button>
          <div className="template-info">
            <strong>Expected format:</strong>
            <code>{template.headers}</code>
            <strong>Example:</strong>
            <code>{template.example}</code>
          </div>
        </div>

        <div className="section">
          <h4>Import from CSV File</h4>
          <p className="help-text">
            Upload a CSV file from your computer
          </p>
          <div className="import-actions">
            <label className="file-upload-btn">
              Choose CSV File
              <input type="file" accept=".csv" onChange={handleFileUpload} />
            </label>
            {csvText && (
              <button
                className="import-btn"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? 'Importing...' : 'Import Loaded File'}
              </button>
            )}
          </div>
        </div>

        <div className="section">
          <h4>Import from CSV Paste</h4>
          <p className="help-text">
            Paste CSV data directly
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paste CSV data here...\n\n${template.headers}\n${template.example}`}
            rows={6}
          />
          <button
            className="import-btn"
            onClick={handleImport}
            disabled={loading || !csvText.trim()}
          >
            {loading ? 'Importing...' : 'Import CSV'}
          </button>
        </div>

        <div className="section">
          <h4>Export to CSV</h4>
          <p className="help-text">
            Download all {activeEntity} as a CSV file
          </p>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? 'Exporting...' : `Export ${activeEntity}`}
          </button>
        </div>

        {status && <div className="status-msg success">{status}</div>}
        {error && <div className="status-msg error">{error}</div>}
      </div>
    </div>
  );
}
