import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, Home as HomeIcon, Search, User, Package, Menu, ChevronRight, Truck, Store as StoreIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import StallsPage from './pages/StallsPage';
import StallDetailPage from './pages/StallDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import SellerRegistrationPage from './pages/SellerRegistrationPage';
import BuyerRegistrationPage from './pages/BuyerRegistrationPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';

// Context/State (Simplified for demo)
import { CartItem } from './types';

import { MOCK_ORDERS } from './data/mock';

import { StallsProvider } from './context/StallsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

import RegistrationModal from './components/RegistrationModal';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StallsProvider>
          <MarketApp />
        </StallsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function MarketApp() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  
  const activeOrdersCount = orders.filter(o => o.status === 'shipped' || o.status === 'pending').length;
  
  const addToCart = (item: CartItem) => {
    if (!isAuthenticated) {
      setIsRegistrationModalOpen(true);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const clearCart = () => setCart([]);

  const addOrder = (newOrder: any) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Header 
          cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
        />
        
        <main className="container mx-auto px-4 pb-24 pt-20 max-w-7xl">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/produtos" element={<ProductsPage addToCart={addToCart} />} />
              <Route path="/produtos/:id" element={<ProductDetailPage addToCart={addToCart} />} />
              <Route path="/barracas" element={<StallsPage />} />
              <Route path="/barracas/:id" element={<StallDetailPage addToCart={addToCart} />} />
              
              {isAuthenticated && user?.role === 'buyer' && (
                <>
                  <Route path="/carrinho" element={<CartPage cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} />} />
                  <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} addOrder={addOrder} />} />
                  <Route path="/pedidos" element={<OrdersPage orders={orders} />} />
                </>
              )}

              <Route path="/painel-vendedor" element={<SellerDashboardPage />} />
              <Route path="/painel-vendedor/:id" element={<SellerDashboardPage />} />
              <Route path="/cadastro-vendedor" element={<SellerRegistrationPage />} />
              <Route path="/cadastro-comprador" element={<BuyerRegistrationPage />} />
              <Route path="/painel-comprador" element={<BuyerDashboardPage />} />
            </Routes>
          </AnimatePresence>
        </main>

        <MobileNav 
          cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
          ordersCount={activeOrdersCount} 
        />
        <RegistrationModal 
          isOpen={isRegistrationModalOpen} 
          onClose={() => setIsRegistrationModalOpen(false)} 
        />
        <Toaster position="top-center" />
      </div>
    </Router>
  );
}

function Header({ cartCount }: { cartCount: number }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-green-600 p-1.5 rounded-lg">
            <Package className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-green-800">CEASA <span className="text-slate-400 font-light">Market</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium hover:text-green-600 transition-colors">Início</Link>
          <Link to="/produtos" className="text-sm font-medium hover:text-green-600 transition-colors">Produtos</Link>
          <Link to="/barracas" className="text-sm font-medium hover:text-green-600 transition-colors">Barracas</Link>
          <Link to={isAuthenticated ? `/painel-vendedor/${user?.barracaId}` : "/painel-vendedor"} className="text-sm font-medium hover:text-green-600 transition-colors flex items-center gap-1">
            <StoreIcon className="w-4 h-4" /> Vender
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && user?.role === 'buyer' && (
            <Link to="/carrinho">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1.5 min-w-[1.25rem] h-5 bg-green-600 hover:bg-green-700">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-2 md:gap-3">
              <Link to={user?.role === 'seller' ? `/painel-vendedor/${user?.barracaId}` : "/painel-comprador"}>
                <Button variant="outline" size="sm" className="gap-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 px-2 sm:px-4">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.role === 'seller' ? 'Painel Produtor' : 'Meu Painel'}</span>
                  <span className="sm:hidden">Painel</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hidden sm:flex">Sair</Button>
            </div>
          ) : (
            <Link to="/painel-vendedor">
              <Button variant="outline" size="sm" className="flex gap-2 border-green-600 text-green-600 hover:bg-green-50 px-4 sm:px-6 h-10 rounded-xl font-bold">
                <User className="w-4 h-4" />
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileNav({ cartCount, ordersCount }: { cartCount: number, ordersCount: number }) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const navItems = [
    { icon: Store, label: 'Início', path: '/' },
    { icon: Search, label: 'Busca', path: '/produtos' },
    ...(isAuthenticated && user?.role === 'buyer' ? [
      { 
        icon: ShoppingCart, 
        label: 'Carrinho', 
        path: '/carrinho', 
        badge: cartCount 
      },
      { 
        icon: Truck, 
        label: 'Entregas', 
        path: '/pedidos', 
        badge: ordersCount 
      }
    ] : []),
    { 
      icon: isAuthenticated && user?.role === 'buyer' ? User : (isAuthenticated && user?.role === 'seller' ? StoreIcon : User), 
      label: (isAuthenticated && user?.role === 'buyer') ? 'Meu Painel' : 'Comprador', 
      path: (isAuthenticated && user?.role === 'buyer') ? '/painel-comprador' : '/painel-comprador'
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] overflow-x-auto">
      <div className="max-w-7xl mx-auto flex justify-around items-center h-20 min-w-[320px]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute top-0 left-0 right-0 h-1 bg-green-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <div className="relative mb-1.5">
                <item.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 px-1.5 min-w-[1.25rem] h-5 text-[10px] bg-green-600 border-white border-2 flex items-center justify-center">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-[11px] sm:text-[13px] font-semibold tracking-tight ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
