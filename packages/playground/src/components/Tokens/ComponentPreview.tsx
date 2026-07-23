interface ComponentPreviewProps {
  components?: Record<string, unknown>;
  search: string;
}

export function ComponentPreview({ components, search }: ComponentPreviewProps) {
  if (!components || typeof components !== 'object') {
    return <div className="empty-state">No components defined</div>;
  }

  const filtered = Object.entries(components).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="component-preview">
      {filtered.map(([name, value]) => (
        <div key={name} className="component-card">
          <div className="component-header">
            <h4>{name}</h4>
          </div>
          <div className="component-details">
            <div className="component-type">
              Type:{' '}
              <span className="type-value">
                {typeof value === 'object' ? 'object' : typeof value}
              </span>
            </div>
            {typeof value === 'object' && value !== null && (
              <div className="component-properties">
                <h5>Properties</h5>
                <table className="properties-table">
                  <tbody>
                    {Object.entries(value as Record<string, unknown>).map(([key, val]) => (
                      <tr key={key}>
                        <td className="prop-name">{key}</td>
                        <td className="prop-value">
                          <code>{String(val)}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
