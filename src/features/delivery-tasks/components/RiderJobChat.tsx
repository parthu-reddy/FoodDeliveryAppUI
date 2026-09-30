import type { Order } from "@/types";
import { ChatWidget } from "@features/communication/components/ChatWidget";

/** Chat for the job in hand, with the customer and the restaurant. Moved out of DeliveryDashboard. */
export function RiderJobChat({ job }: { job: Order }) {
  return (
    <ChatWidget
      orderId={job.id}
      order={job}
    />
  );
}
