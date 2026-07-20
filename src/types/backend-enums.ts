/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2026-07-20 13:24:05.

export enum AccountType {
    CUSTOMER = "CUSTOMER",
    PLATFORM = "PLATFORM",
    RESTAURANT = "RESTAURANT",
    DRIVER = "DRIVER",
}

export enum ChannelType {
    SMS = "SMS",
    EMAIL = "EMAIL",
    PUSH = "PUSH",
    WHATSAPP = "WHATSAPP",
}

export enum OrderStatus {
    CREATED = "CREATED",
    PAID = "PAID",
    AWAITING_DELAY_APPROVAL = "AWAITING_DELAY_APPROVAL",
    ACCEPTED = "ACCEPTED",
    PREPARING = "PREPARING",
    READY_FOR_PICKUP = "READY_FOR_PICKUP",
    DISPATCHED = "DISPATCHED",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    CANCELLED_BY_RESTAURANT = "CANCELLED_BY_RESTAURANT",
    DELIVERY_FAILED = "DELIVERY_FAILED",
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
    CANCELLED_AND_REFUNDED = "CANCELLED_AND_REFUNDED",
}

export enum OutboxStatus {
    UNPROCESSED = "UNPROCESSED",
    IN_PROGRESS = "IN_PROGRESS",
    PROCESSED = "PROCESSED",
    FAILED = "FAILED",
    DLQ = "DLQ",
}

export enum PaymentGateway {
    RAZORPAY = "RAZORPAY",
    CASHFREE = "CASHFREE",
    VYAPAR = "VYAPAR",
}

export enum RefundStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

export enum RoleName {
    CUSTOMER = "CUSTOMER",
    DELIVERY = "DELIVERY",
    RESTAURANT = "RESTAURANT",
    ADMIN = "ADMIN",
}

export enum TransactionDirection {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT",
}

export enum TransactionStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
}
