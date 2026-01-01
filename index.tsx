import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

/** --- INITIAL DEFAULTS --- **/
const INITIAL_PRODUCTS = [
  { id: "1", name: "Batasha", description: "Traditional sugar drops, airy and sweet.", price: 50, weight: "250g", category: "Sweets", image: "batasha.jpg" },
  { id: "2", name: "Motichoor", description: "Tiny pearls of gram flour fried in pure ghee.", price: 50, weight: "250g", category: "Sweets", image: "motichoor.jpg" },
  { id: "3", name: "Ladoo", description: "Classic sweet balls made with high-quality ingredients.", price: 60, weight: "250g", category: "Sweets", image: "ladoo.jpg" },
  { id: "4", name: "Malai Barfi", description: "Rich, creamy milk fudge with a soft texture.", price: 100, weight: "250g", category: "Sweets", image: "malai_barfi.jpg" },
  { id: "10", name: "Milk Cake", description: "Gram flour and ghee based sweet with a porous texture.", price: 100, weight: "250g", category: "Sweets", image: "milk_cake.jpg" },
  { id: "11", name: "Black Forest", description: "Mast cake hai lelo", price: 600, weight: "1KG", category: "Cakes", image: "black_forest.jpg" }
];

const DEFAULT_SETTINGS = { 
  appName: "RamDev Shop",
  minOrder: 100, 
  platformFee: 1, 
  deliveryFee: 5, 
  ownerWhatsApp: "918369258002", 
  upiId: "paytmqr62rtez@ptys",
  theme: {
    primary: "#ea580c",
    secondary: "#9a3412",
    background: "#fffaf0"
  }
};

const ADMIN_PASSWORD = "Pawan1645@";

/** --- UTILS --- **/
const generateInvoicePDF = (order: any, shopName: string) => {
  // @ts-ignore
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(234, 88, 12);
  doc.text(shopName, 20, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice ID: #RD-${order.id.slice(-6).toUpperCase()}`, 20, 30);
  doc.text(`Date: ${new Date(order.date).toLocaleString()}`, 20, 35);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Customer Details:", 20, 50);
  doc.setFontSize(10);
  doc.text(`Name: ${order.profile.fullName}`, 20, 56);
  doc.text(`Phone: ${order.profile.phone}`, 20, 61);
  doc.text(`Address: ${order.profile.address}`, 20, 66, { maxWidth: 100 });
  const tableData = order.cart.map((item: any) => [item.name, `x${item.quantity}`, `Rs. ${item.price}`, `Rs. ${item.price * item.quantity}`]);
  // @ts-ignore
  doc.autoTable({
    startY: 80,
    head: [['Product', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12] },
  });
  const finalY = (doc.lastAutoTable.finalY || 80) + 10;
  doc.setFontSize(10);
  doc.text(`Subtotal: Rs. ${order.cartTotal}`, 140, finalY);
  doc.text(`Platform Fee: Rs. ${order.platformFee || 0}`, 140, finalY + 5);
  doc.text(`Delivery Fee: Rs. ${order.deliveryFee || 0}`, 140, finalY + 10);
  doc.setFontSize(14);
  doc.setTextColor(234, 88, 12);
  doc.text(`Grand Total: Rs. ${order.totalWithFees}`, 140, finalY + 20);
  doc.save(`${shopName}_Invoice_${order.id.slice(-4)}.pdf`);
};

/** --- ADMIN COMPONENTS --- **/
const AdminDashboard = ({ appData, onUpdateAppData, onBack }: any) => {
  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [ghToken, setGhToken] = useState(localStorage.getItem('gh_token') || '');
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('gh_repo') || ''); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const syncToGithub = async () => {
    if (!ghToken || !ghRepo) return alert("Please set GitHub credentials.");
    setIsSyncing(true);
    setSyncMessage('Syncing...');
    localStorage.setItem('gh_token', ghToken);
    localStorage.setItem('gh_repo', ghRepo);
    try {
      const url = `https://api.github.com/repos/${ghRepo}/contents/app_data.json`;
      const headers = { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' };
      const getRes = await fetch(url, { headers });
      let sha = "";
      if (getRes.ok) sha = (await getRes.json()).sha;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(appData, null, 2))));
      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ message: `Admin update: ${new Date().toLocaleString()}`, content, sha: sha || undefined })
      });
      if (!putRes.ok) throw new Error('Sync failed.');
      setSyncMessage('SUCCESS!');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (err: any) { alert(err.message); setSyncMessage('Failed'); } 
    finally { setIsSyncing(false); }
  };

  return (
    <div className="min-h-screen bg-white pb-40 fade-in p-4 pt-8 text-left">
      <div className="flex items-center justify-between mb-8 px-2">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">ADMIN PANEL</h1>
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center border shadow-sm"><i className="fas fa-times text-gray-400"></i></button>
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar py-2">
        {['products', 'categories', 'settings', 'sync'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[var(--primary)] text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div className="space-y-4">
          <button onClick={() => setEditingProduct({ id: '', name: '', price: 0, weight: '', category: appData.categories[0], image: '', description: '', isNew: true })} className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest">ADD ITEM</button>
          <div className="space-y-3">
            {appData.products.map((p: any) => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border flex items-center gap-4 shadow-sm">
                <img src={p.image} className="w-14 h-14 object-cover rounded-xl bg-gray-100" onError={(e:any)=>e.target.src='https://via.placeholder.com/100'} />
                <div className="flex-1"><h4 className="font-bold text-sm text-gray-900">{p.name}</h4><p className="text-[10px] text-gray-400 font-bold uppercase">₹{p.price} • {p.category}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingProduct(p)} className="w-9 h-9 bg-orange-50 text-[var(--primary)] rounded-xl flex items-center justify-center"><i className="fas fa-pen text-[11px]"></i></button>
                  <button onClick={() => { if(confirm('Delete?')) onUpdateAppData({...appData, products: appData.products.filter((i: any) => i.id !== p.id)}); }} className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><i className="fas fa-trash text-[11px]"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <button onClick={() => { const n = prompt('New Category:'); if(n) onUpdateAppData({...appData, categories: [...appData.categories, n]}); }} className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest">ADD NEW CATEGORY</button>
          <div className="space-y-3">
            {appData.categories.map((cat: string) => (
              <div key={cat} className="bg-white p-5 rounded-3xl border flex justify-between items-center shadow-sm">
                <span className="font-black text-gray-900 uppercase text-xs tracking-widest">{cat}</span>
                <button onClick={() => { if(confirm('Delete category?')) onUpdateAppData({...appData, categories: appData.categories.filter((c:string) => c !== cat)}); }} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-[40px] shadow-soft border space-y-8 text-left">
          <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">App Display Name</label><input type="text" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-800 text-lg" value={appData.settings.appName} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, appName: e.target.value}})} /></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Primary Color</label><input type="color" className="w-full h-16 p-1 bg-gray-50 rounded-2xl border-none outline-none cursor-pointer" value={appData.settings.theme.primary} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, theme: {...appData.settings.theme, primary: e.target.value}}})} /></div>
            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Secondary Color</label><input type="color" className="w-full h-16 p-1 bg-gray-50 rounded-2xl border-none outline-none cursor-pointer" value={appData.settings.theme.secondary} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, theme: {...appData.settings.theme, secondary: e.target.value}}})} /></div>
          </div>
          <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">App Background</label><input type="color" className="w-full h-16 p-1 bg-gray-50 rounded-2xl border-none outline-none cursor-pointer" value={appData.settings.theme.background} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, theme: {...appData.settings.theme, background: e.target.value}}})} /></div>

          <div className="border-t pt-8 space-y-6">
            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Owner WhatsApp (91XXXXXXXXXX)</label><input type="text" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-800 text-lg" value={appData.settings.ownerWhatsApp} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, ownerWhatsApp: e.target.value}})} /></div>
            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">UPI ID For Payments</label><input type="text" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-800 text-lg" value={appData.settings.upiId} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, upiId: e.target.value}})} /></div>
            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Min Order Amount (₹)</label><input type="number" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-800 text-lg" value={appData.settings.minOrder} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, minOrder: parseInt(e.target.value)||0}})} /></div>
            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Platform Fee (₹)</label><input type="number" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-800 text-lg" value={appData.settings.platformFee} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, platformFee: parseInt(e.target.value)||0}})} /></div>
            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block ml-2">Delivery Fee (₹)</label><input type="number" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold text-gray-800 text-lg" value={appData.settings.deliveryFee} onChange={e => onUpdateAppData({...appData, settings: {...appData.settings, deliveryFee: parseInt(e.target.value)||0}})} /></div>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="bg-white p-8 rounded-[40px] shadow-soft border space-y-4">
          <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-xs font-mono" placeholder="GitHub PAT Token" value={ghToken} onChange={e => setGhToken(e.target.value)} />
          <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-xs font-mono" placeholder="User/Repo" value={ghRepo} onChange={e => setGhRepo(e.target.value)} />
          <button disabled={isSyncing} onClick={syncToGithub} className="w-full py-5 bg-[var(--primary)] text-white rounded-2xl font-black shadow-xl uppercase tracking-widest text-sm active:scale-95 transition-all">{syncMessage || 'PUSH TO LIVE'}</button>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 animate-slideUp overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black mb-8 uppercase text-gray-900 tracking-tighter">{editingProduct.isNew ? 'NEW' : 'EDIT'} PRODUCT</h3>
            <div className="space-y-4 text-left">
              <div><label className="text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 block">NAME</label><input className="w-full p-4 bg-gray-50 rounded-xl font-bold border" placeholder="Product Name" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 block">PRICE (₹)</label><input type="number" className="w-full p-4 bg-gray-50 rounded-xl font-bold border" placeholder="50" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} /></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 block">WEIGHT</label><input className="w-full p-4 bg-gray-50 rounded-xl font-bold border" placeholder="250g" value={editingProduct.weight} onChange={e => setEditingProduct({...editingProduct, weight: e.target.value})} /></div>
              </div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 block">CATEGORY</label><select className="w-full p-4 bg-gray-50 rounded-xl font-bold border outline-none" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                {appData.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 block">IMAGE URL / NAME</label><input className="w-full p-4 bg-gray-50 rounded-xl font-mono text-xs border" placeholder="filename.jpg" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 block">DESCRIPTION</label><textarea className="w-full p-4 bg-gray-50 rounded-xl border font-medium text-sm resize-none" rows={3} placeholder="Small text..." value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} /></div>
              <div className="pt-6 flex gap-3">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                <button onClick={() => {
                  const newList = editingProduct.isNew ? [...appData.products, { ...editingProduct, id: Date.now().toString(), isNew: undefined }] : appData.products.map((p: any) => p.id === editingProduct.id ? editingProduct : p);
                  onUpdateAppData({...appData, products: newList});
                  setEditingProduct(null);
                }} className="flex-2 py-4 bg-[var(--primary)] text-white rounded-2xl font-black uppercase text-xs shadow-lg tracking-widest">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminLogin = ({ onLogin, onBack }: any) => {
  const [pass, setPass] = useState('');
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 fade-in text-center">
      <div className="w-20 h-20 bg-orange-100 rounded-3xl mb-8 flex items-center justify-center text-[var(--primary)] text-3xl shadow-inner"><i className="fas fa-lock"></i></div>
      <h1 className="text-3xl font-black mb-8 uppercase tracking-tighter text-gray-900 leading-none">OWNER ACCESS</h1>
      <div className="w-full max-w-xs space-y-4">
        <input type="password" placeholder="ENTER SECRET PIN" className="w-full p-5 bg-gray-50 rounded-2xl border text-center font-bold tracking-[0.5em] outline-none focus:border-[var(--primary)]" value={pass} onChange={e => setPass(e.target.value)} onKeyPress={e => e.key === 'Enter' && (pass === ADMIN_PASSWORD ? onLogin() : alert('Wrong PIN!'))} />
        <button onClick={() => pass === ADMIN_PASSWORD ? onLogin() : alert('Wrong PIN!')} className="w-full py-5 bg-[var(--primary)] text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm">ACCESS DASHBOARD</button>
        <button onClick={onBack} className="text-gray-400 font-bold text-[10px] uppercase tracking-widest py-4">Back to Shop</button>
      </div>
    </div>
  );
};

/** --- APP WRAPPER --- **/
const App = () => {
  const [view, setView] = useState<'onboarding' | 'catalog' | 'cart' | 'checkout' | 'orders' | 'admin_login' | 'admin_panel'>('onboarding'); 
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState<any>({
    products: INITIAL_PRODUCTS,
    categories: ['Sweets', 'Cakes', 'Snacks', 'Drinks'],
    settings: DEFAULT_SETTINGS
  });
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [category, setCategory] = useState('Sweets');
  const [profile, setProfile] = useState<any>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'pickup'>('home');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');

  // Load Data
  useEffect(() => {
    const init = async () => {
      const savedData = localStorage.getItem('ramdev_app_data');
      let dataToSet = {
        products: INITIAL_PRODUCTS,
        categories: ['Sweets', 'Cakes', 'Snacks', 'Drinks'],
        settings: { ...DEFAULT_SETTINGS }
      };

      if (savedData) {
        const parsed = JSON.parse(savedData);
        dataToSet = {
          ...dataToSet,
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings, theme: { ...DEFAULT_SETTINGS.theme, ...(parsed.settings?.theme || {}) } }
        };
      }

      try {
        const res = await fetch('./products.json?v=' + Date.now());
        if (res.ok) {
          const remote = await res.json();
          dataToSet = {
            ...dataToSet,
            ...remote,
            settings: { ...dataToSet.settings, ...(remote.settings || {}), theme: { ...dataToSet.settings.theme, ...(remote.settings?.theme || {}) } }
          };
          if (remote.categories?.length > 0) setCategory(remote.categories[0]);
        }
      } catch(e) {}
      
      setAppData(dataToSet);

      const storedProfile = localStorage.getItem('ramdev_profile');
      if (storedProfile) { setProfile(JSON.parse(storedProfile)); setView('catalog'); }
      const storedOrders = localStorage.getItem('ramdev_orders');
      if (storedOrders) setOrders(JSON.parse(storedOrders));
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLoading && appData.products.length > 0) {
      localStorage.setItem('ramdev_app_data', JSON.stringify(appData));
    }
  }, [appData, isLoading]);

  // Inject Theme Variables Safely
  useEffect(() => {
    if (!appData.settings.theme) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', appData.settings.theme.primary || DEFAULT_SETTINGS.theme.primary);
    root.style.setProperty('--secondary', appData.settings.theme.secondary || DEFAULT_SETTINGS.theme.secondary);
    root.style.setProperty('--app-bg', appData.settings.theme.background || DEFAULT_SETTINGS.theme.background);
    document.body.style.backgroundColor = appData.settings.theme.background || DEFAULT_SETTINGS.theme.background;
    
    // Update loader text to match app name
    const loaderText = document.getElementById('loader-text');
    if (loaderText) loaderText.textContent = appData.settings.appName;
  }, [appData.settings.theme, appData.settings.appName]);

  useEffect(() => {
    const loader = document.getElementById('loader');
    if (loader && !isLoading) { loader.style.opacity = '0'; setTimeout(() => loader.remove(), 400); }
  }, [isLoading]);

  const updateCart = (product: any, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        return newQty <= 0 ? prev.filter(i => i.id !== product.id) : prev.map(i => i.id === product.id ? { ...i, quantity: newQty } : i);
      }
      return delta > 0 ? [...prev, { ...product, quantity: delta }] : prev;
    });
  };

  const getItemQty = (id: string) => cart.find(i => i.id === id)?.quantity || 0;
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = (deliveryMethod === 'home' && cartTotal < appData.settings.minOrder) ? appData.settings.deliveryFee : 0;
  const totalWithFees = cartTotal + appData.settings.platformFee + deliveryFee;

  const handleOrderConfirm = () => {
    const newOrder = { id: Date.now().toString(), date: new Date().toISOString(), cart: [...cart], cartTotal, platformFee: appData.settings.platformFee, deliveryFee, totalWithFees, profile, deliveryMethod, paymentMethod };
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('ramdev_orders', JSON.stringify(updatedOrders));
    const msg = `🛍️ *${appData.settings.appName.toUpperCase()} ORDER*\n👤 *Customer:* ${profile.fullName}\n📞 *Phone:* ${profile.phone}\n📍 *Address:* ${profile.address}\n\n🍰 *Items:*\n${cart.map(i => `• ${i.name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join('\n')}\n\n🔥 *Grand Total: ₹${totalWithFees}*`;
    window.location.href = `https://api.whatsapp.com/send?phone=${appData.settings.ownerWhatsApp}&text=${encodeURIComponent(msg)}`;
    setCart([]); setView('catalog');
  };

  if (isLoading) return null;
  if (view === 'admin_login') return <AdminLogin onLogin={() => setView('admin_panel')} onBack={() => setView('catalog')} />;
  if (view === 'admin_panel') return <AdminDashboard appData={appData} onUpdateAppData={setAppData} onBack={() => setView('catalog')} />;

  if (view === 'onboarding') return (
    <div className="min-h-screen bg-white p-10 flex flex-col items-center justify-center text-center fade-in">
      <div className="w-24 h-24 bg-[var(--primary)] rounded-[32px] flex items-center justify-center text-white text-4xl shadow-xl mb-10"><i className="fas fa-cookie-bite"></i></div>
      <h1 className="text-4xl font-black mb-10 uppercase tracking-tighter text-gray-900 leading-none">{appData.settings.appName}</h1>
      <div className="space-y-6 w-full max-w-xs text-left">
        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">FULL NAME</label><input className="w-full p-4 bg-gray-50 rounded-2xl border outline-none font-bold" placeholder="Your Name" id="reg-name" /></div>
        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">WHATSAPP NUMBER</label><input className="w-full p-4 bg-gray-50 rounded-2xl border outline-none font-bold" placeholder="10 Digits" id="reg-phone" type="tel" /></div>
        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">ADDRESS</label><textarea className="w-full p-4 bg-gray-50 rounded-2xl border outline-none font-bold" placeholder="Full Delivery Address" id="reg-address" rows={3} /></div>
        <button onClick={() => {
          const p = { fullName: (document.getElementById('reg-name') as HTMLInputElement).value, phone: (document.getElementById('reg-phone') as HTMLInputElement).value, address: (document.getElementById('reg-address') as HTMLTextAreaElement).value };
          if (p.fullName && p.phone && p.address) { setProfile(p); localStorage.setItem('ramdev_profile', JSON.stringify(p)); setView('catalog'); }
        }} className="w-full py-5 bg-[var(--primary)] text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all tracking-widest text-sm uppercase">Enter Shop</button>
      </div>
      <button onClick={() => setView('admin_login')} className="mt-16 text-gray-300 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 pb-1">STAFF ACCESS</button>
    </div>
  );

  if (view === 'orders') return (
    <div className="min-h-screen p-4 pt-16 text-left fade-in">
       <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('catalog')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center border shadow-sm active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button>
        <h2 className="text-2xl font-black uppercase tracking-tighter">ORDER HISTORY</h2>
      </div>
      {orders.length === 0 ? <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">No previous orders</div> : (
        <div className="space-y-4 pb-20">
          {orders.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-[32px] shadow-soft border border-orange-50">
              <div className="flex justify-between items-start mb-4">
                <div><p className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">ID: RD-{o.id.slice(-6).toUpperCase()}</p><p className="text-xs font-bold text-gray-500 leading-none">{new Date(o.date).toLocaleDateString()}</p></div>
                <span className="text-[var(--primary)] font-black text-sm">₹{o.totalWithFees}</span>
              </div>
              <div className="space-y-2 mb-6 border-l-2 border-orange-100 pl-4 ml-1">
                {o.cart.map((i: any) => <p key={i.id} className="text-[11px] text-gray-600 font-bold leading-tight">{i.name} (x{i.quantity})</p>)}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setCart(o.cart); setView('cart'); }} className="flex-1 py-3 bg-[var(--primary)] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Re-order</button>
                <button onClick={() => generateInvoicePDF(o, appData.settings.appName)} className="flex-1 py-3 bg-white text-[var(--primary)] border border-orange-200 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Invoice PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (view === 'catalog') return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center justify-between border-b border-orange-50">
        <div className="flex items-center gap-3" onClick={() => setView('onboarding')}>
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white shadow-lg"><i className="fas fa-user text-sm"></i></div>
          <div className="text-left leading-none"><h1 className="text-base font-black text-gray-900 leading-none tracking-tighter uppercase">{appData.settings.appName}</h1><p className="text-[10px] text-[var(--primary)] font-black uppercase mt-1">HI, {profile?.fullName?.split(' ')[0]}</p></div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('orders')} className="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-90"><i className="fas fa-history text-lg"></i></button>
          <button onClick={() => setView('cart')} className="relative w-10 h-10 flex items-center justify-center text-gray-700 active:scale-90">{cart.length > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white z-10">{cart.length}</span>}<i className="fas fa-shopping-basket text-xl"></i></button>
        </div>
      </header>
      <main className="pt-20 pb-40 px-4 fade-in">
        <nav className="flex gap-2 mb-8 overflow-x-auto no-scrollbar py-2">
          {appData.categories.map((cat: string) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex-shrink-0 shadow-sm ${category === cat ? 'bg-[var(--primary)] text-white shadow-orange-100' : 'bg-white text-orange-900 border border-orange-50'}`}>{cat}</button>
          ))}
        </nav>
        <div className="grid grid-cols-2 gap-4">
          {appData.products.filter((p: any) => p.category === category).map((p: any) => {
            const qty = getItemQty(p.id);
            return (
              <div key={p.id} className="bg-white rounded-[28px] overflow-hidden shadow-soft border border-orange-50 flex flex-col h-full text-left">
                <div className="h-40 bg-gray-100 relative group overflow-hidden">
                  <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e: any) => e.target.src='https://via.placeholder.com/300?text=Sweets'} />
                  <div className="absolute bottom-3 right-3">
                    {qty === 0 ? (
                      <button onClick={() => updateCart(p, 1)} className="px-6 py-2 bg-white text-[var(--primary)] font-black text-[11px] rounded-xl border border-orange-100 shadow-xl uppercase active:scale-95 transition-all tracking-widest">ADD</button>
                    ) : (
                      <div className="flex items-center bg-white rounded-xl border border-orange-100 shadow-xl overflow-hidden">
                        <button onClick={() => updateCart(p, -1)} className="px-3 py-2 text-[var(--primary)] active:bg-orange-50 transition-colors"><i className="fas fa-minus text-[9px]"></i></button>
                        <span className="px-2 text-xs font-black text-orange-900">{qty}</span>
                        <button onClick={() => updateCart(p, 1)} className="px-3 py-2 text-[var(--primary)] active:bg-orange-50 transition-colors"><i className="fas fa-plus text-[9px]"></i></button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-[14px] font-black text-gray-900 mb-1 leading-tight tracking-tight">{p.name}</h3>
                  <p className="text-[11px] text-gray-400 mb-4 flex-1 line-clamp-2 leading-tight font-medium">{p.description}</p>
                  <div className="mt-auto flex justify-between items-center"><span className="text-[16px] font-black text-[var(--primary)] tracking-tighter">₹{p.price}</span><span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{p.weight}</span></div>
                </div>
              </div>
            );
          })}
        </div>
        {appData.products.filter((p: any) => p.category === category).length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200 text-2xl mb-4"><i className="fas fa-box-open"></i></div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nothing here yet</p>
          </div>
        )}
      </main>
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto animate-slideUp">
          <button onClick={() => setView('cart')} className="w-full bg-[var(--primary)] text-white font-black py-5 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex justify-between px-8 items-center border-b-4 border-[var(--secondary)] active:translate-y-0.5 active:border-b-0 transition-all">
            <span className="text-xs uppercase tracking-widest">{cart.length} Items</span>
            <span className="text-sm font-black uppercase tracking-widest">Cart • ₹{totalWithFees} <i className="fas fa-arrow-right ml-2 text-xs"></i></span>
          </button>
        </div>
      )}
    </div>
  );

  if (view === 'cart') return (
    <div className="min-h-screen bg-white p-4 pt-16 text-left fade-in">
      <div className="flex gap-4 mb-8"><button onClick={() => setView('catalog')} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none">YOUR CART</h2></div>
      <div className="space-y-4 mb-8">
        {cart.map(item => (
          <div key={item.id} className="flex gap-5 p-5 bg-orange-50/20 rounded-[32px] border border-orange-100/30">
            <img src={item.image} className="w-20 h-20 object-cover rounded-2xl shadow-sm" onError={(e:any)=>e.target.src='https://via.placeholder.com/150'} />
            <div className="flex-1">
              <h4 className="font-black text-gray-900 text-sm mb-1 leading-tight">{item.name}</h4>
              <p className="text-[var(--primary)] font-black text-base tracking-tighter">₹{item.price * item.quantity}</p>
              <div className="flex items-center gap-4 mt-3">
                <button onClick={() => updateCart(item, -1)} className="w-8 h-8 bg-white rounded-xl border border-orange-100 flex items-center justify-center text-xs shadow-sm"><i className="fas fa-minus text-[8px]"></i></button>
                <span className="font-black text-gray-900">{item.quantity}</span>
                <button onClick={() => updateCart(item, 1)} className="w-8 h-8 bg-white rounded-xl border border-orange-100 flex items-center justify-center text-xs shadow-sm"><i className="fas fa-plus text-[8px]"></i></button>
              </div>
            </div>
            <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-gray-300 p-2"><i className="fas fa-times"></i></button>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 p-8 rounded-[40px] space-y-3 mb-12 border border-orange-50 shadow-inner">
        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Subtotal</span><span className="text-gray-900">₹{cartTotal}</span></div>
        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Platform Fee</span><span className="text-gray-900">₹{appData.settings.platformFee}</span></div>
        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Delivery Charge</span><span className="text-gray-900">{deliveryFee === 0 ? 'FREE' : '₹'+deliveryFee}</span></div>
        <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between font-black text-2xl tracking-tighter text-gray-900"><span>Grand Total</span><span className="text-[var(--primary)]">₹{totalWithFees}</span></div>
      </div>
      <button onClick={() => setView('checkout')} className="w-full py-5 bg-[var(--primary)] text-white rounded-[24px] font-black shadow-xl uppercase tracking-widest text-sm active:scale-95 transition-all">Proceed to Checkout</button>
    </div>
  );

  if (view === 'checkout') return (
    <div className="min-h-screen bg-white p-4 pt-16 text-left fade-in">
      <div className="flex gap-4 mb-8"><button onClick={() => setView('cart')} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none">Confirmation</h2></div>
      <div className="space-y-10 pb-40">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 ml-2">Delivery Method</label>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setDeliveryMethod('home')} className={`p-6 rounded-[28px] border-2 transition-all flex flex-col items-center gap-3 ${deliveryMethod === 'home' ? 'border-[var(--primary)] bg-orange-50 text-orange-900 shadow-lg shadow-orange-100' : 'border-gray-50 bg-gray-50 text-gray-400'}`}><i className="fas fa-truck text-2xl"></i><span className="font-black text-[10px] uppercase tracking-widest">Doorstep</span></button>
            <button onClick={() => setDeliveryMethod('pickup')} className={`p-6 rounded-[28px] border-2 transition-all flex flex-col items-center gap-3 ${deliveryMethod === 'pickup' ? 'border-[var(--primary)] bg-orange-50 text-orange-900 shadow-lg shadow-orange-100' : 'border-gray-50 bg-gray-50 text-gray-400'}`}><i className="fas fa-store text-2xl"></i><span className="font-black text-[10px] uppercase tracking-widest">Pickup</span></button>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 ml-2">Payment Option</label>
          <div className="space-y-4">
            <button onClick={() => setPaymentMethod('cod')} className={`w-full p-6 rounded-[28px] border-2 transition-all flex items-center gap-5 ${paymentMethod === 'cod' ? 'border-[var(--primary)] bg-orange-50 text-orange-900 shadow-lg shadow-orange-100' : 'border-gray-50 bg-gray-50 text-gray-400'}`}><i className="fas fa-money-bill-wave text-2xl"></i><span className="font-black text-xs uppercase tracking-widest">Cash on Delivery</span></button>
            <button onClick={() => setPaymentMethod('upi')} className={`w-full p-6 rounded-[28px] border-2 transition-all flex items-center gap-5 ${paymentMethod === 'upi' ? 'border-[var(--primary)] bg-orange-50 text-orange-900 shadow-lg shadow-orange-100' : 'border-gray-50 bg-gray-50 text-gray-400'}`}><i className="fas fa-qrcode text-2xl"></i><span className="font-black text-xs uppercase tracking-widest">UPI QR Pay</span></button>
          </div>
        </div>
        {paymentMethod === 'upi' && (
          <div className="bg-white p-8 rounded-[40px] border-2 border-dashed border-orange-200 text-center shadow-soft">
             <p className="text-[11px] font-black text-orange-900 mb-4 uppercase tracking-widest">PAYABLE: ₹{totalWithFees}</p>
             <div className="bg-red-50 p-4 rounded-2xl mb-6 border border-red-100">
                <p className="text-[10px] font-black text-red-600 uppercase leading-tight">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Send screenshot on WhatsApp to confirm order, otherwise order will be not accepted.
                </p>
             </div>
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${appData.settings.upiId}%26pn=${encodeURIComponent(appData.settings.appName)}%26am=${totalWithFees}%26cu=INR`} className="mx-auto w-48 h-48 rounded-2xl border-4 border-white shadow-2xl mb-6" />
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Scan with GPay / PhonePe / Paytm</p>
          </div>
        )}
      </div>
      <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto">
         <button onClick={handleOrderConfirm} className="w-full bg-[var(--primary)] text-white font-black py-5 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]">PLACE ORDER <i className="fab fa-whatsapp text-2xl"></i></button>
      </div>
    </div>
  );
  return null;
};

createRoot(document.getElementById('root')!).render(<App />);