import { useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { VerificationStatus, type Brand } from '@/types';

/**
 * Live KYC status for this restaurant's brands.
 *
 * Only opens the stream while a brand is actually awaiting verification — a dashboard whose
 * brands are all approved has nothing to listen for, and an always-on SSE connection is a
 * socket held open for no reason.
 *
 * Lifted verbatim out of `RestaurantDashboard`, where 50 lines of EventSource plumbing sat
 * between the profile effect and the order filters.
 */

export function useBrandKycStream(
  brands: Brand[],
  setBrands: React.Dispatch<React.SetStateAction<Brand[]>>,
) {
// Listen for brand updates (KYC status) via SSE
useEffect(() => {
  const abortController = new AbortController();
  const hasPendingVerifications = brands.some(
    b => b.kycStatus === VerificationStatus.PENDING || b.pennyDropStatus === VerificationStatus.PENDING
  );

  if (hasPendingVerifications) {
    const startSse = async () => {
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/brands/stream`;
        await fetchEventSource(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'text/event-stream',
            'X-Calling-Service': 'RestaurantApplication'
          },
          signal: abortController.signal,
          onmessage(msg: { data: string; event?: string }) {
            if (msg.event === 'brands-update') {
              try {
                const fetchedBrands = JSON.parse(msg.data);
                setBrands(fetchedBrands);
              } catch (e: unknown) {
                console.error('Error parsing brand SSE data', e);
              }
            }
          },
          onclose() {
            console.log('SSE connection closed');
          },
          onerror(err: unknown) {
            console.error('SSE connection error:', err);
            // Avoid auto-reconnecting on unrecoverable errors like 401/403
            throw err; 
          }
        });
      } catch (e: unknown) {
        console.error("Failed to start SSE for brand updates:", e);
      }
    };
    
    startSse();
  }

  return () => {
    abortController.abort();
  };
}, [brands, setBrands]);
}
