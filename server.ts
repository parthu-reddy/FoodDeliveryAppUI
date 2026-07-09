import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// In-memory data
let brands = [
  {
    id: 'brand-1',
    name: 'Bella Italia Group Ltd',
    gstin: '29ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    cin: 'U72200KA2021PTC142012',
    bankAccountNumber: '987654321012',
    ifscCode: 'ICIC0000104',
    logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    owner: 'Bella Italia Manager',
    createdAt: '2026-01-10T10:00:00.000Z'
  }
];

let outlets = [
  {
    id: 'rest-2',
    brandId: 'brand-1',
    name: 'Bella Italia Pizzeria (Indiranagar)',
    fssaiLicenseNumber: '11223344556677',
    lat: 12.9716,
    lng: 77.5946,
    openingTime: '09:00:00',
    closingTime: '23:00:00',
    bannerUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    createdAt: '2026-01-10T11:30:00.000Z'
  }
];

let masterMenuItems = [
  {
    id: 'master-pizza-1',
    brandId: 'brand-1',
    name: 'Burrata & Prosciutto Pizza',
    basePrice: 18.49,
    defaultPrepTimeMinutes: 15,
    description: 'San Marzano tomatoes, hand-torn creamy burrata mozzarella, 24-month aged Parma prosciutto, and baby arugula.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    category: 'Pizza',
    isVeg: false
  },
  {
    id: 'master-pizza-2',
    brandId: 'brand-1',
    name: 'Margherita DOC',
    basePrice: 13.99,
    defaultPrepTimeMinutes: 12,
    description: 'The absolute classic. Buffalo mozzarella, organic San Marzano tomato sauce, fresh basil sprigs, and extra virgin olive oil.',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
    category: 'Pizza',
    isVeg: true
  }
];

let outletOverrides = [
  {
    outletId: 'rest-2',
    masterMenuItemId: 'master-pizza-1',
    price: 19.99, // surged price
    active: true
  }
];

// --- Brands & Outlets ---

app.get('/api/v1/brands', (req, res) => {
  res.json(brands);
});

app.post('/api/v1/brands', (req, res) => {
  const newBrand = req.body;
  brands.push(newBrand);
  res.status(201).json(newBrand);
});

app.get('/api/v1/brands/:brandId/outlets', (req, res) => {
  const { brandId } = req.params;
  const brandOutlets = outlets.filter(o => o.brandId === brandId);
  res.json(brandOutlets);
});

app.get('/api/v1/outlets', (req, res) => {
  res.json(outlets); // Support fetching all for demo
});

app.post('/api/v1/brands/:brandId/outlets', (req, res) => {
  const { brandId } = req.params;
  const newOutlet = { ...req.body, brandId };
  outlets.push(newOutlet);
  res.status(201).json(newOutlet);
});

// For backward compatibility from previous tabs if any
app.get('/api/v1/restaurants/:restaurantId', (req, res) => {
  const { restaurantId } = req.params;
  const outlet = outlets.find(o => o.id === restaurantId);
  if (outlet) res.json(outlet);
  else res.status(404).json({ error: "Not found" });
});

// --- Master Menu & Overrides ---

app.get('/api/v1/brands/:brandId/master-menu', (req, res) => {
  const { brandId } = req.params;
  const items = masterMenuItems.filter(i => i.brandId === brandId);
  res.json(items);
});

app.post('/api/v1/brands/:brandId/master-menu', (req, res) => {
  const { brandId } = req.params;
  const newItem = { ...req.body, brandId, id: `master-${Math.random().toString(36).substring(2, 7)}` };
  masterMenuItems.push(newItem);
  res.status(201).json(newItem);
});

app.get('/api/v1/outlets/:outletId/menu-overrides', (req, res) => {
  const { outletId } = req.params;
  const overrides = outletOverrides.filter(o => o.outletId === outletId);
  res.json(overrides);
});

app.post('/api/v1/outlets/:outletId/menu-overrides/:masterMenuItemId', (req, res) => {
  const { outletId, masterMenuItemId } = req.params;
  const { price, active } = req.body;
  
  const existingIdx = outletOverrides.findIndex(o => o.outletId === outletId && o.masterMenuItemId === masterMenuItemId);
  
  const override = { outletId, masterMenuItemId, price, active };
  
  if (existingIdx > -1) {
    outletOverrides[existingIdx] = override;
  } else {
    outletOverrides.push(override);
  }
  
  res.status(200).json(override);
});

let deliveryRiders: any[] = [];

app.post("/api/delivery/onboard", (req, res) => {
  const { name, phoneNumber, vehicleNumber, photoUrl } = req.body;
  if (!name || !name.trim() || !phoneNumber || !phoneNumber.trim() || !vehicleNumber || !vehicleNumber.trim() || !photoUrl || !photoUrl.trim()) {
    return res.status(400).json({ error: "Missing mandatory fields" });
  }

  let rider = deliveryRiders.find(r => r.phoneNumber === phoneNumber);
  if (rider) {
    rider.name = name;
    rider.vehicleNumber = vehicleNumber;
    rider.photoUrl = photoUrl;
  } else {
    rider = { id: `rider-${Math.random().toString(36).substr(2, 9)}`, name, phoneNumber, vehicleNumber, photoUrl, isOnline: false };
    deliveryRiders.push(rider);
  }
  res.json({ success: true, rider });
});

app.get("/api/delivery/profile", (req, res) => {
  const { phoneNumber } = req.query;
  const rider = deliveryRiders.find(r => r.phoneNumber === phoneNumber);
  if (!rider) {
    return res.status(404).json({ error: "Rider not found" });
  }
  res.json({ success: true, rider });
});

app.post("/api/delivery/status", (req, res) => {
  const { driverId, available } = req.body;
  const rider = deliveryRiders.find(r => r.id === driverId);
  if (rider) {
    rider.isOnline = available;
    res.json({ success: true, rider });
  } else {
    res.status(404).json({ error: "Rider not found" });
  }
});

app.post("/api/delivery/drivers/:driverId/orders/:orderId/accept", (req, res) => {
  const { driverId, orderId } = req.params;
  // Just echo success
  res.json({ success: true, driverId, orderId, status: "accepted" });
});

app.post("/api/delivery/drivers/:driverId/orders/:orderId/reject", (req, res) => {
  const { driverId, orderId } = req.params;
  res.json({ success: true, driverId, orderId, status: "rejected" });
});

app.post("/api/delivery/drivers/:driverId/orders/:orderId/status", (req, res) => {
  const { driverId, orderId } = req.params;
  const { status } = req.body;
  res.json({ success: true, driverId, orderId, status });
});

app.post("/api/delivery/drivers/:driverId/orders/:orderId/timeout", (req, res) => {
  const { driverId, orderId } = req.params;
  res.json({ success: true, driverId, orderId, status: "timeout" });
});

app.post("/api/v1/delivery/telemetry/batch", (req, res) => {
  res.json({ success: true });
});

app.get("/api/v1/logistics/route", (req, res) => {
  res.json({ success: true, polyline: "mock_polyline" });
});

app.get('/api/v1/restaurants/:restaurantId/catalog/items', (req, res) => {
  const { restaurantId } = req.params;
  
  const outlet = outlets.find(o => o.id === restaurantId);
  if (!outlet) return res.status(404).json({ error: "Outlet not found" });
  
  const brandMasters = masterMenuItems.filter(i => i.brandId === outlet.brandId);
  const localOverrides = outletOverrides.filter(o => o.outletId === restaurantId);
  
  const effectiveMenu = brandMasters.map(master => {
    const override = localOverrides.find(o => o.masterMenuItemId === master.id);
    return {
      id: master.id, // we expose the master ID as the menu item ID for orders
      name: master.name,
      price: override && override.price !== undefined ? override.price : master.basePrice,
      description: master.description,
      category: master.category,
      image: master.imageUrl,
      rating: 5.0,
      isVeg: master.isVeg,
      isAvailable: override && override.active !== undefined ? override.active : true
    };
  });
  
  // Filter out inactive items for the customer catalog
  const activeMenu = effectiveMenu.filter(item => item.isAvailable);
  
  res.json(activeMenu);
});

app.get('/api/v1/restaurants/:restaurantId/menu', (req, res) => {
  // Alias for backward compatibility if needed, though catalog/items is the official
  const { restaurantId } = req.params;
  const outlet = outlets.find(o => o.id === restaurantId);
  if (!outlet) return res.status(404).json({ error: "Outlet not found" });
  const brandMasters = masterMenuItems.filter(i => i.brandId === outlet.brandId);
  const localOverrides = outletOverrides.filter(o => o.outletId === restaurantId);
  const effectiveMenu = brandMasters.map(master => {
    const override = localOverrides.find(o => o.masterMenuItemId === master.id);
    return {
      id: master.id,
      name: master.name,
      price: override && override.price !== undefined ? override.price : master.basePrice,
      description: master.description,
      category: master.category,
      image: master.imageUrl,
      rating: 5.0,
      isVeg: master.isVeg,
      isAvailable: override && override.active !== undefined ? override.active : true
    };
  });
  res.json(effectiveMenu);
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
  app.use("/api/*", (req, res) => res.status(404).json({ error: "API route not found" }));
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
