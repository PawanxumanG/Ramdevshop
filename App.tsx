
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SHOP_NAME, PRODUCTS, OWNER_WHATSAPP, UPI_ID } from './constants.ts';

/** --- TYPES --- **/
export type Category = 'Sweets' | 'Cakes' | 'Snacks';
export interface Product { id: string; name: string; description: string; price: number; category: Category; image: string; }
export interface CartItem extends Product { quantity: number; }
export interface UserDetails { fullName: string; phone: string; address: string; deliveryMethod: 'pickup' | 'home'; paymentMethod: 'qr' | 'cod'; }
export type AppView = 'catalog' | 'cart' | 'checkout' | 'success';

/** --- SUB-COMPONENTS --- **/

// Added interface for HeaderProps to fix typing issues
interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartCount, onOpenCart }) => (
  <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-sm border-b border-orange-100 shadow-sm px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md">
        <i className="fas fa-cookie-bite text-xl"></i>
      </div>
      <div>
        <h1 className="text-xl font-bold text-orange-900 tracking-tight leading-none">{SHOP_NAME}</h1>
        <p className="text-[10px] text-orange-600 font-medium uppercase tracking-widest mt-0.5">Premium Sweets & Cakes</p>
      </div>
    </div>
    <button onClick={onOpenCart} className="text-orange-900 w-10 h-10 rounded-full hover:bg-orange-50 transition-colors relative">
      <i className="fas fa-shopping-cart"></i>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
          {cartCount}
        </span>
      )}
    </button>
  </header>
);

// Added interface for ProductCardProps to resolve the "key property does not exist" error on line 185
interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, onQuickBuy }) => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-orange-50 flex flex-col h-full">
    <div className="relative h-32 overflow-hidden">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      <div className="absolute top-1.5 right-1.5">
        <span className="bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-md text-[8px] font-black text-orange-800 shadow-sm uppercase tracking-wider">{product.category}</span>
      </div>
    </div>
    <div className="p-3 flex flex-col flex-1">
      <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-1 text-left">{product.name}</h3>
      <p className="text-[10px] text-gray-500 line-clamp-2 mb-2 flex-1 leading-normal text-left">{product.description}</p>
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-orange-600">₹{product.price}</span>
          <button onClick={() => onAdd(product)} className="w-7 h-7 rounded-lg border border-orange-200 text-orange-600 flex items-center justify-center"><i className="fas fa-plus text-[10px]"></i></button>
        </div>
        <button onClick={() => onQuickBuy(product)} className="w-full bg-orange-600 text-white text-[10px] font-black py-2 rounded-lg uppercase tracking-tighter">ORDER NOW</button>
      </div>
    </div>
  </div>
);

// Added interface for CartOverlayProps
interface CartOverlayProps {
  cart: CartItem[];
  total: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  onCheckout: () => void;
}

const CartOverlay: React.FC<CartOverlayProps> = ({ cart, total, onUpdateQuantity, onRemove, onClose, onCheckout }) => (
  <div className="px-4 py-6 bg-white min-h-screen">
    <div className="flex items-center justify-between mb-8">
      <button onClick={onClose} className="p-2 text-gray-500"><i className="fas fa-arrow-left text-lg"></i></button>
      <h2 className="text-2xl font-bold text-gray-900">My Cart</h2>
      <div className="w-10"></div>
    </div>
    <div className="space-y-6 mb-44">
      {cart.map(item => (
        <div key={item.id} className="flex gap-4 p-4 bg-orange-50/50 rounded-2xl relative">
          <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
          <div className="flex-1 text-left">
            <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
            <p className="text-orange-600 font-black">₹{item.price * item.quantity}</p>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg border border-orange-200 bg-white text-orange-600 text-xs">-</button>
              <span className="font-bold text-sm">{item.quantity}</span>
              <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg border border-orange-200 bg-white text-orange-600 text-xs">+</button>
            </div>
          </div>
          <button onClick={() => onRemove(item.id)} className="absolute top-2 right-2 text-gray-300"><i className="fas fa-times"></i></button>
        </div>
      ))}
    </div>
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-6 rounded-t-[32px] shadow-2xl z-[60]">
      <div className="flex justify-between mb-6">
        <div className="text-left"><span className="text-[10px] font-bold text-gray-400 uppercase">Total</span><p className="text-2xl font-black text-orange-900">₹{total}</p></div>
      </div>
      <button onClick={onCheckout} className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3">PROCEED TO ORDER <i className="fas fa-arrow-right"></i></button>
    </div>
  </div>
);

// Added interface for CheckoutFormProps
interface CheckoutFormProps {
  total: number;
  onSubmit: (details: UserDetails) => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ total, onSubmit, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', deliveryMethod: 'home' as 'home' | 'pickup', paymentMethod: 'cod' as 'qr' | 'cod' });
  const isFormValid = formData.fullName && formData.phone.length >= 10 && formData.address;
  const generateQR = () => `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(SHOP_NAME)}&am=${total}&cu=INR`)}`;

  return (
    <div className="px-4 py-8 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-10 text-left">
        <button onClick={step === 1 ? onCancel : () => setStep(1)} className="p-2"><i className="fas fa-arrow-left text-lg"></i></button>
        <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
      </div>
      {step === 1 ? (
        <div className="space-y-6 text-left">
          <input className="w-full p-4 bg-gray-50 rounded-xl border" placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
          <input className="w-full p-4 bg-gray-50 rounded-xl border" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <textarea className="w-full p-4 bg-gray-50 rounded-xl border" rows={3} placeholder="Full Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setFormData({...formData, deliveryMethod: 'home'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.deliveryMethod === 'home' ? 'border-orange-500 bg-orange-50' : 'bg-gray-50'}`}><i className="fas fa-truck"></i><span className="text-[10px] font-bold">DELIVERY</span></button>
            <button onClick={() => setFormData({...formData, deliveryMethod: 'pickup'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.deliveryMethod === 'pickup' ? 'border-orange-500 bg-orange-50' : 'bg-gray-50'}`}><i className="fas fa-store"></i><span className="text-[10px] font-bold">PICKUP</span></button>
          </div>
          <button disabled={!isFormValid} onClick={() => setStep(2)} className={`w-full py-4 rounded-2xl font-black ${isFormValid ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-300'}`}>REVIEW PAYMENT</button>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          <div className="space-y-3">
            <button onClick={() => setFormData({...formData, paymentMethod: 'qr'})} className={`w-full p-5 rounded-xl border-2 flex items-center gap-4 ${formData.paymentMethod === 'qr' ? 'border-orange-500 bg-orange-50' : 'bg-gray-50'}`}><i className="fas fa-qrcode text-xl"></i><div><p className="font-bold text-sm">Scan QR Code</p><p className="text-[10px]">Auto-fills ₹{total}</p></div></button>
            <button onClick={() => setFormData({...formData, paymentMethod: 'cod'})} className={`w-full p-5 rounded-xl border-2 flex items-center gap-4 ${formData.paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'bg-gray-50'}`}><i className="fas fa-money-bill-wave text-xl"></i><div><p className="font-bold text-sm">Cash on Delivery</p><p className="text-[10px]">Pay when it arrives</p></div></button>
          </div>
          {formData.paymentMethod === 'qr' && (
            <div className="text-center p-6 bg-white border border-dashed rounded-3xl"><p className="text-xs font-bold mb-4">Amount: ₹{total}</p><img src={generateQR()} className="mx-auto w-40 h-40 mb-2" /><p className="text-[10px] text-orange-600">Scan with GPay, PhonePe or Paytm</p></div>
          )}
          <button onClick={() => onSubmit(formData as UserDetails)} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3"><i className="fab fa-whatsapp"></i> SEND ORDER ON WHATSAPP</button>
        </div>
      )}
    </div>
  );
};

// Added interface for SuccessScreenProps
interface SuccessScreenProps {
  userDetails: UserDetails;
  cart: CartItem[];
  total: number;
  onDone: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ userDetails, cart, total, onDone }) => {
  useEffect(() => {
    const itemsText = cart.map(item => `• ${item.name} (${item.quantity}x) - ₹${item.price * item.quantity}`).join('\n');
    const message = `🛍️ *NEW ORDER: ${SHOP_NAME}*\n👤 *Customer:* ${userDetails.fullName}\n📞 *Phone:* ${userDetails.phone}\n📍 *Address:* ${userDetails.address}\n🚚 *Method:* ${userDetails.deliveryMethod}\n💳 *Payment:* ${userDetails.paymentMethod === 'qr' ? 'UPI' : 'COD'}\n\n🍰 *Items:* \n${itemsText}\n\n💰 *TOTAL: ₹${total}*`;
    window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  }, []);
  return (
    <div className="px-6 py-12 text-center bg-white min-h-screen flex flex-col items-center justify-center">
      <i className="fas fa-check-circle text-6xl text-green-500 mb-6"></i>
      <h2 className="text-2xl font-black mb-2 uppercase">Order Sent!</h2>
      <p className="text-sm text-gray-500 mb-10">Check WhatsApp to confirm your order.</p>
      <button onClick={onDone} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold uppercase text-xs">Return to Menu</button>
    </div>
  );
};

/** --- MAIN APP COMPONENT --- **/

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.quantity, 0), [cart]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const handleQuickBuy = useCallback((product: Product) => { addToCart(product); setView('cart'); }, [addToCart]);
  const removeFromCart = useCallback((id: string) => setCart(prev => prev.filter(item => item.id !== id)), []);
  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }, []);

  const renderContent = () => {
    if (view === 'cart') return <CartOverlay cart={cart} total={cartTotal} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onClose={() => setView('catalog')} onCheckout={() => setView('checkout')} />;
    if (view === 'checkout') return <CheckoutForm total={cartTotal} onSubmit={(d) => { setUserDetails(d); setView('success'); }} onCancel={() => setView('cart')} />;
    if (view === 'success') return <SuccessScreen userDetails={userDetails!} cart={cart} total={cartTotal} onDone={() => { setCart([]); setView('catalog'); }} />;
    
    return (
      <div className="pb-24 px-4 py-16">
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar py-4">
          {['All', 'Sweets', 'Cakes', 'Snacks'].map(cat => (
            <button key={cat} className="px-5 py-2 bg-white border border-orange-100 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-900 shadow-sm whitespace-nowrap">
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {PRODUCTS.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} onQuickBuy={handleQuickBuy} />)}
        </div>
        {cart.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-40">
            <button onClick={() => setView('cart')} className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-2xl flex justify-between px-6 items-center">
              <span className="flex items-center gap-2"><i className="fas fa-shopping-basket"></i> {cartCount} Items</span>
              <span>₹{cartTotal} <i className="fas fa-chevron-right ml-2 text-xs"></i></span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#fffaf0] relative">
      {view === 'catalog' && <Header cartCount={cartCount} onOpenCart={() => setView('cart')} />}
      <main className="flex-1 overflow-y-auto">{renderContent()}</main>
    </div>
  );
};

export default App;
