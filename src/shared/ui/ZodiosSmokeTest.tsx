import { useEffect, useState } from 'react';
import { customerApi } from '../../lib/zodiosClients';

export default function ZodiosSmokeTest() {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    customerApi.customerProfile.get('/api/v1/customers/profile')
      .then(res => {
        // Because of Zodios, 'res' is fully typed based on the OpenAPI schema!
        // It validates the runtime response against the schema.
        setData(res);
      })
      .catch(err => {
        setError(err);
      });
  }, []);

  return (
    <div>
      <h3>Zodios Smoke Test</h3>
      {error ? <div style={{ color: 'red' }}>Error: {(error as {message?: string}).message}</div> : null}
      {data ? (
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
