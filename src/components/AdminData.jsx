import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './AdminData.css';

export default function AdminData() {
  const [activeTab, setActiveTab] = useState('companies');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const tabs = [
    { id: 'companies', label: 'Companies' },
    { id: 'people', label: 'People' },
    { id: 'firms', label: 'Firms' },
    { id: 'rounds', label: 'Rounds' },
    { id: 'goals', label: 'Goals' },
    { id: 'deals', label: 'Deals' }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(activeTab)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from(activeTab)
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete item');
    }
  }

  async function handleSave(formData) {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from(activeTab)
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(activeTab)
          .insert([formData]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save item: ' + error.message);
    }
  }

  function handleEdit(item) {
    setEditingItem(item);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingItem(null);
    setShowForm(true);
  }

  return (
    <div className="admin-data">
      <div className="admin-data-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setShowForm(false);
              setEditingItem(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-data-content">
        {!showForm ? (
          <>
            <div className="admin-data-toolbar">
              <button className="add-btn" onClick={handleAdd}>+ Add {activeTab.slice(0, -1)}</button>
              <span className="count">{data.length} items</span>
            </div>

            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <DataTable
                data={data}
                entityType={activeTab}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </>
        ) : (
          <EntityForm
            entityType={activeTab}
            initialData={editingItem}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function DataTable({ data, entityType, onEdit, onDelete }) {
  if (data.length === 0) {
    return <div className="empty-state">No {entityType} yet. Click "Add" to create one.</div>;
  }

  const columns = getColumnsForEntity(entityType);

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              {columns.map(col => (
                <td key={col.key}>{formatValue(item[col.key], col.type)}</td>
              ))}
              <td className="actions">
                <button className="edit-btn" onClick={() => onEdit(item)}>Edit</button>
                <button className="delete-btn" onClick={() => onDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntityForm({ entityType, initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState(initialData || {});
  const fields = getFieldsForEntity(entityType);

  function handleChange(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(formData);
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <h3>{initialData ? 'Edit' : 'Add'} {entityType.slice(0, -1)}</h3>

      <div className="form-fields">
        {fields.map(field => (
          <div key={field.key} className="form-field">
            <label>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
              />
            ) : field.type === 'select' ? (
              <select
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
              >
                <option value="">Select...</option>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={formData[field.key] || false}
                onChange={(e) => handleChange(field.key, e.target.checked)}
              />
            ) : (
              <input
                type={field.type || 'text'}
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="save-btn">Save</button>
      </div>
    </form>
  );
}

function getColumnsForEntity(entityType) {
  const columnMap = {
    companies: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'is_portfolio', label: 'Portfolio', type: 'boolean' },
      { key: 'stage', label: 'Stage', type: 'text' },
      { key: 'sector', label: 'Sector', type: 'text' },
      { key: 'cash_on_hand', label: 'Cash', type: 'currency' },
      { key: 'runway', label: 'Runway', type: 'number' }
    ],
    people: [
      { key: 'first_name', label: 'First Name', type: 'text' },
      { key: 'last_name', label: 'Last Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' }
    ],
    firms: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'firm_type', label: 'Type', type: 'text' },
      { key: 'typical_check_min', label: 'Min Check', type: 'currency' },
      { key: 'typical_check_max', label: 'Max Check', type: 'currency' }
    ],
    rounds: [
      { key: 'round_type', label: 'Type', type: 'text' },
      { key: 'target_amount', label: 'Target', type: 'currency' },
      { key: 'raised_amount', label: 'Raised', type: 'currency' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'target_close_date', label: 'Target Close', type: 'date' }
    ],
    goals: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'goal_type', label: 'Type', type: 'text' },
      { key: 'target_value', label: 'Target', type: 'text' },
      { key: 'current_value', label: 'Current', type: 'text' },
      { key: 'is_on_track', label: 'On Track', type: 'boolean' }
    ],
    deals: [
      { key: 'deal_stage', label: 'Stage', type: 'text' },
      { key: 'expected_amount', label: 'Expected Amount', type: 'currency' },
      { key: 'last_contact_date', label: 'Last Contact', type: 'date' }
    ]
  };
  return columnMap[entityType] || [];
}

function getFieldsForEntity(entityType) {
  const fieldMap = {
    companies: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'is_portfolio', label: 'Portfolio Company', type: 'checkbox' },
      { key: 'stage', label: 'Stage', type: 'select', options: ['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth'] },
      { key: 'sector', label: 'Sector', type: 'select', options: ['fintech', 'healthtech', 'edtech', 'enterprise_saas', 'consumer', 'marketplace', 'infrastructure', 'ai_ml', 'climate', 'other'] },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'cash_on_hand', label: 'Cash on Hand', type: 'number' },
      { key: 'monthly_burn', label: 'Monthly Burn', type: 'number' },
      { key: 'mrr', label: 'MRR', type: 'number' },
      { key: 'employee_count', label: 'Employee Count', type: 'number' }
    ],
    people: [
      { key: 'first_name', label: 'First Name', type: 'text', required: true },
      { key: 'last_name', label: 'Last Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'role', label: 'Role', type: 'select', options: ['founder', 'investor', 'operator', 'advisor', 'employee'], required: true },
      { key: 'title', label: 'Title', type: 'text' }
    ],
    firms: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'firm_type', label: 'Type', type: 'select', options: ['vc', 'angel_syndicate', 'family_office', 'corporate_vc', 'accelerator'], required: true },
      { key: 'typical_check_min', label: 'Typical Check Min', type: 'number' },
      { key: 'typical_check_max', label: 'Typical Check Max', type: 'number' }
    ],
    rounds: [
      { key: 'round_type', label: 'Round Type', type: 'select', options: ['pre_seed', 'seed', 'seed_extension', 'series_a', 'series_b', 'bridge'], required: true },
      { key: 'target_amount', label: 'Target Amount', type: 'number', required: true },
      { key: 'raised_amount', label: 'Raised Amount', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'closing', 'closed', 'abandoned'] },
      { key: 'target_close_date', label: 'Target Close Date', type: 'date' }
    ],
    goals: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'goal_type', label: 'Type', type: 'select', options: ['fundraise', 'revenue', 'hiring', 'product', 'partnership', 'operational'], required: true },
      { key: 'target_value', label: 'Target Value', type: 'text' },
      { key: 'current_value', label: 'Current Value', type: 'text' },
      { key: 'target_date', label: 'Target Date', type: 'date' },
      { key: 'is_on_track', label: 'On Track', type: 'checkbox' }
    ],
    deals: [
      { key: 'deal_stage', label: 'Stage', type: 'select', options: ['identified', 'contacted', 'meeting_scheduled', 'meeting_held', 'diligence', 'term_sheet', 'committed', 'closed', 'dropped'], required: true },
      { key: 'expected_amount', label: 'Expected Amount', type: 'number' },
      { key: 'last_contact_date', label: 'Last Contact Date', type: 'date' }
    ]
  };
  return fieldMap[entityType] || [];
}

function formatValue(value, type) {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    case 'boolean':
      return value ? '✓' : '✗';
    case 'date':
      return value ? new Date(value).toLocaleDateString() : '-';
    case 'number':
      return typeof value === 'number' ? value.toFixed(1) : value;
    default:
      return value;
  }
}
