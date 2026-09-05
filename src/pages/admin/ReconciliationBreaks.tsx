import React, { useEffect, useState } from 'react';

export const ReconciliationBreaks = () => {
    const [breaks, setBreaks] = useState<any[]>([]);
    
    useEffect(() => {
        fetch('/api/v1/ledger/admin/reconciliation/breaks')
            .then(res => res.json())
            .then(data => setBreaks(data.content || []))
            .catch(console.error);
    }, []);

    return (
        <div>
            <h1>Reconciliation Breaks</h1>
            <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Kind</th>
                        <th>Expected</th>
                        <th>Actual</th>
                        <th>Subject</th>
                        <th>Resolved</th>
                    </tr>
                </thead>
                <tbody>
                    {breaks.map((b: any) => (
                        <tr key={b.id}>
                            <td>{b.id}</td>
                            <td>{b.kind}</td>
                            <td>{b.expected}</td>
                            <td>{b.actual}</td>
                            <td>{b.subjectType}: {b.subjectId}</td>
                            <td>{b.resolvedAt ? 'Yes' : 'No'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
