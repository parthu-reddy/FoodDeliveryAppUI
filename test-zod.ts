import { OrderResponse } from './src/api/generated/schemas/customer/common';

try {
  OrderResponse.parse({
    id: "123e4567-e89b-12d3-a456-426614174000",
    customerId: "123e4567-e89b-12d3-a456-426614174000",
    restaurantId: "123e4567-e89b-12d3-a456-426614174000",
    // restaurantName is intentionally missing to verify Zod strictness
    status: "CREATED",
    deliveryStatus: "PENDING",
    totalAmount: 100.0,
    itemTotal: 90.0,
    foodCost: 90.0,
    customerPlatformFee: 5.0,
    restaurantPlatformFee: 0.0,
    platformBonus: 0.0,
    restaurantDeliveryContribution: 0.0,
    restaurantPayout: 90.0,
    sgst: 2.5,
    cgst: 2.5,
    deliveryFee: 10.0,
    driverGrossPayout: 0.0,
    driverTaxes: 0.0,
    driverNetPayout: 0.0,
    deliveryAddress: "123 Main St",
    deliveryLat: 0.0,
    deliveryLng: 0.0,
    items: [],
    createdAt: "2023-10-27T10:00:00Z",
    updatedAt: "2023-10-27T10:00:00Z"
  });
  console.log("SUCCESS: Zod parsing succeeded!");
} catch (error) {
  console.error("FAILED: Zod parsing failed as expected. Error:");
  console.error(error.errors);
}
