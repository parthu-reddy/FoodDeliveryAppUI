const OrderStatus = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  CANCELLED_BY_RESTAURANT: 'CANCELLED_BY_RESTAURANT',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  AWAITING_DELAY_APPROVAL: 'AWAITING_DELAY_APPROVAL'
};

const res = {
  data: [
    {
      "orderId": "860f0969-c859-4088-aa9d-cf40bbadca1b",
      "restaurantId": "74982418-7a54-4108-999d-a815af961dfc",
      "status": "ON_HOLD",
      "items": [],
      "totalAmount": 100
    }
  ]
};

const mapped = res.data.map((o) => {
  let s = o.status?.toUpperCase() || '';
  if (s === OrderStatus.CREATED || s === OrderStatus.PENDING_ACCEPTANCE) {
    if (s === OrderStatus.CREATED) {
      if (Math.random() > 0.5) {
        s = OrderStatus.PENDING_ACCEPTANCE;
      }
    }
    if (o.additionalPrepTime && o.additionalPrepTime > 10) {
      s = OrderStatus.AWAITING_DELAY_APPROVAL;
    } else {
      s = OrderStatus.PENDING_ACCEPTANCE;
    }
  }
  if (s === OrderStatus.READY_FOR_PICKUP || s === 'READY') s = OrderStatus.READY_FOR_PICKUP;
  if (s === OrderStatus.CANCELLED_BY_RESTAURANT || s === OrderStatus.CANCELLED || s === 'CANCELLED_BY_RESTAURANT' || s === OrderStatus.DELIVERY_FAILED) s = OrderStatus.CANCELLED;
  if (s === OrderStatus.DELIVERED) s = OrderStatus.DELIVERED;
  if (s === 'ON_HOLD') s = OrderStatus.AWAITING_DELAY_APPROVAL;
  
  return { 
    ...o, 
    id: o.orderId || o.id, 
    status: s,
  };
});
console.log(mapped);

const prev = [
  {
    "orderId": "860f0969-c859-4088-aa9d-cf40bbadca1b",
    "restaurantId": "74982418-7a54-4108-999d-a815af961dfc",
    "status": "AWAITING_DELAY_APPROVAL",
    "id": "860f0969-c859-4088-aa9d-cf40bbadca1b"
  }
];

const isDifferent = prev.length !== mapped.length || prev.some((p, i) => p.id !== mapped[i].id || p.status !== mapped[i].status);
console.log("isDifferent:", isDifferent);
