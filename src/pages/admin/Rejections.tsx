import React, { useEffect, useState } from 'react';

export const Rejections = () => {
    const [rejections, setRejections] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/v1/ledger/admin/rejections')
            .then(res => res.json())
            .then(data => setRejections(data.content || []))
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
                    {rejections.map((r: any) => (
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
