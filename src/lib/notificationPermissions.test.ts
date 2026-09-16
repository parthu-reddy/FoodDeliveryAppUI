import { afterEach, describe, expect, test, vi } from "vitest";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showDeliveryAssignmentNotification,
} from "./notificationPermissions";

const originalNotification = window.Notification;

afterEach(() => {
  delete window.deliveryNotificationBridge;
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: originalNotification,
  });
  vi.restoreAllMocks();
});

describe("notification permission adapter", () => {
  test("uses the browser permission API for web and PWA clients", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: class {
        static permission = "prompt";
        static requestPermission = requestPermission;
      },
    });

    await expect(getNotificationPermission()).resolves.toBe("prompt");
    await expect(requestNotificationPermission()).resolves.toBe("granted");
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  test("uses a native bridge when an Android or iOS shell provides one", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    window.deliveryNotificationBridge = {
      getPermissionStatus: vi.fn().mockResolvedValue("granted"),
      requestPermission,
    };

    await expect(getNotificationPermission()).resolves.toBe("granted");
    await expect(requestNotificationPermission()).resolves.toBe("granted");
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  test("reports unsupported clients instead of silently allowing duty", async () => {
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: undefined,
    });

    await expect(getNotificationPermission()).resolves.toBe("unsupported");
    await expect(requestNotificationPermission()).resolves.toBe("unsupported");
  });

  test("routes assignment notifications through the native bridge", async () => {
    const showNotification = vi.fn();
    window.deliveryNotificationBridge = {
      getPermissionStatus: vi.fn().mockResolvedValue("granted"),
      requestPermission: vi.fn().mockResolvedValue("granted"),
      showNotification,
    };

    await showDeliveryAssignmentNotification("73488434-9bfa-4ea8-9f2c-dc328cda66bb");

    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({
      title: "New delivery request",
      tag: "delivery-assignment-73488434-9bfa-4ea8-9f2c-dc328cda66bb",
    }));
  });
});
