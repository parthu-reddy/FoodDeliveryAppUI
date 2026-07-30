/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2026-07-29 14:30:01.

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

export enum ChargeCategory {
    DELIVERY_FEE = "DELIVERY_FEE",
    PLATFORM_FIXED_FEE = "PLATFORM_FIXED_FEE",
    PLATFORM_BONUS = "PLATFORM_BONUS",
    FOOD_COST = "FOOD_COST",
    TIP = "TIP",
    PACKAGING_FEE = "PACKAGING_FEE",
    SURGE_PRICING = "SURGE_PRICING",
    TAX = "TAX",
    SGST = "SGST",
    CGST = "CGST",
    REFUND = "REFUND",
    ORDER_TOTAL = "ORDER_TOTAL",
    PAYOUT = "PAYOUT",
}

export enum DeliveryStatus {
    PENDING = "PENDING",
    ASSIGNED = "ASSIGNED",
    AT_RESTAURANT = "AT_RESTAURANT",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED",
}

export enum OrderStatus {
    CREATED = "CREATED",
    PENDING_ACCEPTANCE = "PENDING_ACCEPTANCE",
    AWAITING_DELAY_APPROVAL = "AWAITING_DELAY_APPROVAL",
    ACCEPTED = "ACCEPTED",
    PREPARING = "PREPARING",
    READY_FOR_PICKUP = "READY_FOR_PICKUP",
    PICKED_UP = "PICKED_UP",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    CANCELLED_BY_RESTAURANT = "CANCELLED_BY_RESTAURANT",
    DELIVERY_FAILED = "DELIVERY_FAILED",
    REQUIRES_MANUAL_INTERVENTION = "REQUIRES_MANUAL_INTERVENTION",
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

export enum VehicleClass {
    BICYCLE = "BICYCLE",
    MCWG = "MCWG",
    LMV = "LMV",
    EV_TWO_WHEELER = "EV_TWO_WHEELER",
}

export enum VerificationStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED",
    MANUAL_REVIEW = "MANUAL_REVIEW",
    FAILED = "FAILED",
}

export enum VerificationType {
    GSTIN = "GSTIN",
    PENNY_DROP = "PENNY_DROP",
    PAN = "PAN",
    DRIVING_LICENSE = "DRIVING_LICENSE",
    RC = "RC",
}
