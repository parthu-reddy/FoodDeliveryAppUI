import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import type { Order } from '@/types';

export type RestaurantTab = 'orders' | 'menu' | 'campaigns' | 'earnings' | 'reviews';

/**
 * Everything the restaurant dashboard reads from, and writes to, the URL: which tab is open,
 * whether settings is showing, and which order's chat. Moved verbatim out of
 * `RestaurantDashboard` (2026-09-24) to bring it back under the 300-line gate.
 */
export function useRestaurantRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive state from route
  const isSettingsView = location.pathname.includes('/restaurant/settings');
  const view = isSettingsView ? 'settings' : 'home';
  const showSettings = isSettingsView;

  const chatMatch = useMatch('/restaurant/chat/:orderId');
  const chatOrderId = chatMatch?.params?.orderId;
  
  let activeTab: RestaurantTab = 'orders';
  if (location.pathname.includes('/menu')) activeTab = 'menu';
  else if (location.pathname.includes('/campaigns')) activeTab = 'campaigns';
  else if (location.pathname.includes('/earnings')) activeTab = 'earnings';
  else if (location.pathname.includes('/reviews')) activeTab = 'reviews';

  const setActiveTab = (tab: typeof activeTab) => navigate(`/restaurant/${tab}`);
  const setView = (v: 'home' | 'settings') => navigate(v === 'settings' ? '/restaurant/settings' : '/restaurant');
  const setShowSettings = (show: boolean) => navigate(show ? '/restaurant/settings' : '/restaurant');

  // Chat state
  const showChatList = location.search.includes('chat=list');
  const setShowChatList = (show: boolean) => {
    if (show) {
      navigate(location.pathname + '?chat=list');
    } else {
      navigate(location.pathname);
    }
  };

  const setSelectedChatOrder = (order: Order | null) => {
    if (order) {
      navigate(`/restaurant/chat/${order.id}`);
    } else {
      navigate('/restaurant');
    }
  };

  return {
    navigate, location, view, showSettings, chatOrderId, activeTab,
    setActiveTab, setView, setShowSettings, showChatList, setShowChatList, setSelectedChatOrder,
  };
}
