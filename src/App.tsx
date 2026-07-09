import React, { useState, useEffect } from 'react';
import { UserRole, Order, OrderStatus } from './types';
import LoginScreen from './components/LoginScreen';
import CinematicFoodBackground from './components/CinematicFoodBackground';
import CustomerDashboard from './components/CustomerDashboard';
import RestaurantDashboard from './components/RestaurantDashboard';
import DeliveryDashboard from './components/DeliveryDashboard';

// Pre-seeded interactive order
const PRE_SEEDED_ORDERS: Order[] = [
  {
    id: 'ord-3740',
    customerName: 'Dianne Russell',
    customerPhone: '9845012345',
    deliveryAddress: 'Avenue 5, Cyber Greens, Penthouse B',
    restaurantId: 'rest-2',
    restaurantName: 'Bella Italia Pizzeria',
    items: [
      {
        item: {
          id: 'menu-2-2',
          name: 'Margherita DOC',
          price: 13.99,
          description: 'Buffalo mozzarella, organic San Marzano tomato sauce, fresh basil.',
          image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
          category: 'Pizza',
          rating: 4.8,
          isVeg: true,
          isAvailable: true,
        },
        quantity: 2
      }
    ],
    subtotal: 27.98,
    deliveryFee: 3.49,
    total: 31.47,
    status: 'dispatched',
    otp: "4820", pickupOtp: "1111",
    timestamp: '09:24 PM'
  },
  {
    id: 'ord-3741',
    customerName: 'Wade Warren',
    customerPhone: '9845012346',
    deliveryAddress: 'Sunset Blvd, Apt 4A',
    restaurantId: 'rest-2',
    restaurantName: 'Bella Italia Pizzeria',
    items: [
      {
        item: {
          id: 'menu-2-3',
          name: 'Pepperoni Pizza',
          price: 15.99,
          description: 'Spicy pepperoni, mozzarella, tomato sauce.',
          image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
          category: 'Pizza',
          rating: 4.5,
          isVeg: false,
          isAvailable: true,
        },
        quantity: 1
      }
    ],
    subtotal: 15.99,
    deliveryFee: 2.99,
    total: 18.98,
    status: 'placed',
    otp: "1234", pickupOtp: "2222",
    timestamp: '10:05 PM'
  },
  {
    id: 'ord-3742',
    customerName: 'Esther Howard',
    customerPhone: '9845012347',
    deliveryAddress: 'Ocean Drive, Villa 2',
    restaurantId: 'rest-2',
    restaurantName: 'Bella Italia Pizzeria',
    items: [
      {
        item: {
          id: 'menu-2-4',
          name: 'Truffle Mushroom Pasta',
          price: 18.50,
          description: 'Creamy truffle sauce, wild mushrooms, parmesan.',
          image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=400&q=80',
          category: 'Pasta',
          rating: 4.9,
          isVeg: true,
          isAvailable: true,
        },
        quantity: 1
      }
    ],
    subtotal: 18.50,
    deliveryFee: 3.49,
    total: 21.99,
    status: 'preparing',
    otp: "5678", pickupOtp: "3333",
    timestamp: '10:12 PM'
  }
];

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [m3Theme, setM3Theme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('qb_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved); 
        if (parsed.length < 3) {
           setOrders(PRE_SEEDED_ORDERS);
           localStorage.setItem("qb_orders", JSON.stringify(PRE_SEEDED_ORDERS));
        } else {
           setOrders(parsed);
        }
      } catch (e) {
        setOrders(PRE_SEEDED_ORDERS);
      }
    } else {
      setOrders(PRE_SEEDED_ORDERS);
      localStorage.setItem('qb_orders', JSON.stringify(PRE_SEEDED_ORDERS));
    }
  }, []);

  const saveOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('qb_orders', JSON.stringify(updatedOrders));
  };

  const handleLoginSuccess = (selectedRole: UserRole, userPhone: string, displayName: string) => {
    setRole(selectedRole);
    setPhone(userPhone);
    setUserName(displayName);
  };

  const handleLogout = () => {
    setRole(null);
    setPhone('');
    setUserName('');
  };

  const handlePlaceOrder = (newOrder: Order) => {
    const updated = [...orders, newOrder];
    saveOrders(updated);
  };

  const handleUpdateOrderStatus = (
    orderId: string, 
    status: OrderStatus, 
    riderInfo?: { name: string; phone: string }
  ) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        const u = { ...order, status };
        if (riderInfo) {
          u.riderId = riderInfo.phone;
          u.riderName = riderInfo.name;
          u.riderPhone = riderInfo.phone;
        }
        return u;
      }
      return order;
    });
    saveOrders(updated);
  };

  const handleToggleTheme = () => {
    setM3Theme(m3Theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden relative w-full h-[100dvh] ${m3Theme === 'dark' ? 'dark text-[#f0ede6]' : 'text-slate-900'}`}>
      {!role ? (
        <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
          <CinematicFoodBackground theme={m3Theme} />
          <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
            <div className="flex-1 flex flex-col w-full h-full justify-center items-center overflow-hidden relative">
              <LoginScreen 
                onLoginSuccess={handleLoginSuccess} 
                theme={m3Theme} 
                onToggleTheme={handleToggleTheme}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden  relative">
          {role === 'customer' && (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
              <CinematicFoodBackground theme={m3Theme} />
              <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                <CustomerDashboard 
                  userName={userName || 'Alex Mercer'} 
                  userPhone={phone || '9876543210'}
                  activeOrders={orders}
                  onPlaceOrder={handlePlaceOrder}
                  onUpdateOrder={handleUpdateOrderStatus}
                  onLogout={handleLogout}
                  theme={m3Theme}
                  onToggleTheme={handleToggleTheme}
                />
              </div>
            </div>
          )}
          {role === 'restaurant' && (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
              <CinematicFoodBackground theme={m3Theme} />
              <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                <RestaurantDashboard 
                  restaurantId="rest-2"
                  activeOrders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onLogout={handleLogout}
                  theme={m3Theme}
                  onToggleTheme={handleToggleTheme}
                />
              </div>
            </div>
          )}
          {role === 'delivery' && (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative ">
              <CinematicFoodBackground theme={m3Theme} />
              <div className="flex-1 flex flex-col min-h-0 w-full h-full z-10 p-0 overflow-hidden relative">
                <DeliveryDashboard 
                  riderPhone={phone || '9988776655'}
                  activeOrders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onLogout={handleLogout}
                  theme={m3Theme}
                  onToggleTheme={handleToggleTheme}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
