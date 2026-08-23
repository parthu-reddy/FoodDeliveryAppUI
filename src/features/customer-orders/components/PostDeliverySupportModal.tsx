import { Button, ErrorBoundary, Modal, Spinner } from "@shared/ui";
import { AlertCircle, Check, HelpCircle, Send } from 'lucide-react';
import { useState } from 'react';

export default function PostDeliverySupportModal(props: any) {
  return (
    <ErrorBoundary>
      <PostDeliverySupportModalInner {...props} />
    </ErrorBoundary>
  );
}

function PostDeliverySupportModalInner({
  isOpen,
  onClose,
  orderId,
  submitSupportRequest // (orderId: string, reason: string) => Promise<void>
}: any) {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for your request.');
      setStatus('error');
      return;
    }

    try {
      setStatus('submitting');
      setErrorMessage('');
      await submitSupportRequest(orderId, reason);
      setStatus('success');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred while submitting your request.');
      setStatus('error');
    }
  };

  const handleClose = () => {
    // Reset state on close
    setTimeout(() => {
      setReason('');
      setStatus('idle');
      setErrorMessage('');
    }, 300);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="flex flex-col items-center text-center px-4 py-2">
        {status === 'idle' || status === 'error' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div className="w-full">
              <h3 className="text-xl font-bold text-slate-900 dark:text-[#f0ede6]">Request Support</h3>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-2 text-left">
                If you have an issue with order <span className="font-semibold">#{orderId?.substring(0, 8)}</span> (e.g. missing items, food quality), please provide details below and our team will review it for a possible refund.
              </p>
            </div>
            
            <div className="w-full mt-4">
              <textarea
                className="w-full h-32 p-3 border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Describe your issue..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
              />
              {status === 'error' && (
                <div className="flex items-center text-red-500 text-sm mt-2">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="w-full space-y-3 mt-6">
              <Button
                onClick={handleSubmit}
                disabled={!reason.trim()}
                variant="primary"
                fullWidth
                icon={<Send className="w-4 h-4" />}
              >
                Submit Request
              </Button>
              <Button
                onClick={handleClose}
                variant="secondary"
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </>
        ) : null}

        {status === 'submitting' && (
          <div className="py-8 flex flex-col items-center">
            <Spinner size="xl" className="text-blue-500 mb-6" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#f0ede6]">Submitting Request</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Please wait a moment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-6 animate-[bounce_0.5s_ease-out]">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#f0ede6]">Request Submitted!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-2 mb-6">
              Our support team will review your request shortly. You will be notified of any refunds.
            </p>
            <Button
              onClick={handleClose}
              variant="primary"
              fullWidth
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
