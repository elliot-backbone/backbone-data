import './QAViolationDetail.css';

export default function QAViolationDetail({ violation, onBack }) {
  if (!violation) return null;

  const { type, title, description, severity, violations, remedy, northStar } = violation;

  const getSeverityColor = (sev) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#3b82f6'
    };
    return colors[sev] || '#64748b';
  };

  return (
    <div className="qa-violation-detail">
      <button className="back-btn" onClick={onBack}>← Back to QA</button>

      <div className="violation-header">
        <div className="violation-title-row">
          <h2>{title}</h2>
          <span
            className="severity-badge"
            style={{
              backgroundColor: `${getSeverityColor(severity)}15`,
              color: getSeverityColor(severity)
            }}
          >
            {severity?.toUpperCase()}
          </span>
        </div>
        {northStar && (
          <div className="north-star-badge">
            North Star Violation: {northStar}
          </div>
        )}
        <p className="violation-description">{description}</p>
      </div>

      <div className="violation-content">
        <div className="violations-section">
          <div className="section-header">
            <h3>Affected Records</h3>
            <span className="count-badge">{violations?.length || 0} violations</span>
          </div>

          {violations && violations.length > 0 ? (
            <div className="violations-list">
              {violations.map((item, index) => (
                <div key={index} className="violation-item">
                  <div className="violation-item-header">
                    <span className="violation-index">#{index + 1}</span>
                    <span className="entity-type">{item.entityType}</span>
                    {item.entityName && (
                      <span className="entity-name">{item.entityName}</span>
                    )}
                  </div>
                  <div className="violation-item-details">
                    {item.field && (
                      <div className="detail-row">
                        <span className="detail-label">Field:</span>
                        <code className="detail-value">{item.field}</code>
                      </div>
                    )}
                    {item.value !== undefined && (
                      <div className="detail-row">
                        <span className="detail-label">Value:</span>
                        <code className="detail-value">{JSON.stringify(item.value)}</code>
                      </div>
                    )}
                    {item.reason && (
                      <div className="detail-row">
                        <span className="detail-label">Reason:</span>
                        <span className="detail-value">{item.reason}</span>
                      </div>
                    )}
                    {item.context && (
                      <div className="detail-row">
                        <span className="detail-label">Context:</span>
                        <span className="detail-value">{item.context}</span>
                      </div>
                    )}
                    {item.recordId && (
                      <div className="detail-row">
                        <span className="detail-label">Record ID:</span>
                        <code className="detail-value record-id">{item.recordId}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No violations found</div>
          )}
        </div>

        <div className="remedy-section">
          <h3>How to Fix</h3>
          <div className="remedy-content">
            {remedy ? (
              Array.isArray(remedy) ? (
                <ol className="remedy-steps">
                  {remedy.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p>{remedy}</p>
              )
            ) : (
              <p>No remedy information available.</p>
            )}
          </div>
        </div>

        <div className="impact-section">
          <h3>Why This Matters</h3>
          <div className="impact-content">
            {type === 'storedDerivations' && (
              <p>
                Stored derivations violate the NoStoredDerivs North Star. When computed values are
                persisted to the database, they can become stale and create inconsistencies. All
                derived values must be computed on-the-fly from raw inputs to ensure accuracy.
              </p>
            )}
            {type === 'missingTTL' && (
              <p>
                Missing TTL (time-to-live) timestamps prevent the system from knowing when data was
                last updated. This breaks trajectory calculations and makes it impossible to detect
                stale data that should trigger priority alerts.
              </p>
            )}
            {type === 'portfolioMixedState' && (
              <p>
                Portfolio entities are mixing stored state with computed views. This violates the
                Portfolio=VIEW North Star, which requires portfolio aggregations to be pure
                presentation layers, not stored state.
              </p>
            )}
            {type === 'goalOrphans' && (
              <p>
                Goals without proper risk context cannot contribute to priority calculations. All
                goals must map to specific risks (Risk→Goal North Star) to enable gap-based urgency
                scoring.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
