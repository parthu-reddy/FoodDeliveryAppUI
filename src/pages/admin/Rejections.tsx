import React, { useEffect, useState } from 'react';
import { ledgerApi } from '@/lib/zodiosClients';

interface Rejection {
  id: string;
  entityType: string;
  entityId: string;
  rejectionReason: string;
  amount: string | number;
  status: string;
  createdAt: string;
}

export const Rejections = () => {
    const [rejections, setRejections] = useState<Rejection[]>([]);

    useEffect(() => {
        ledgerApi.ledger.get('/api/v1/ledger/admin/rejections')
            .then(res => setRejections((res.content as unknown as Rejection[]) || []))
            .catch(console.error);
    }, []);

    return (
        <div>
            <h1>Admin Rejections</h1>
            <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Entity</th>
                        <th>Reason</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {rejections.map((r: Rejection) => (
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.entityType}: {r.entityId}</td>
                            <td>{r.rejectionReason}</td>
                            <td>{r.amount}</td>
                            <td>{r.status}</td>
                            <td>{r.createdAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
