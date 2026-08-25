import { useEffect, useState } from 'react';
import { customerApi } from '../../lib/zodiosClients';

export default function ZodiosSmokeTest() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    customerApi.customerProfile.get('/api/v1/customers/profile')
      .then(res => {
        // Because of Zodios, 'res' is fully typed based on the OpenAPI schema!
        // It validates the runtime response against the schema.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setData(res as any);
      })
      .catch(err => {
        setError(err);
      });
  }, []);

  return (
    <div>
      <h3>Zodios Smoke Test</h3>
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
      {data && (
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
