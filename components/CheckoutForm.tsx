import React, { useState } from 'react';
import { UserDetails, CartItem } from '../types';
import { UPI_ID, SHOP_NAME } from '../constants';

interface CheckoutFormProps {
  total: number;
  cart: CartItem[];
  onSubmit: (details: UserDetails) => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ total, onSubmit, onCancel }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<Partial<UserDetails>>({
    fullName: '',
    phone: '',
    address: '',
    deliveryMethod: 'home',
    paymentMethod: 'cod'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isFormValid = formData.fullName && formData.phone && formData.address && formData.phone.length >= 10;

  const nextStep = () => {
    if (isFormValid) setStep(2);
  };

  // Generate dynamic QR code URL with amount auto-fill
  const generateDynamicQR = () => {
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(SHOP_NAME)}&am=${total}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  };

  return (
    <div className="px-4 py-8 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={step === 1 ? onCancel : () => setStep(1)} className="p-2 -ml-2 text-gray-500 active:scale-90 transition-transform">
          <i className="fas fa-arrow-left text-lg"></i>
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
      </div>

      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
          <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-100'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step === 2 ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="bg-orange-50/50 p-4 rounded-2xl mb-2">
            <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest mb-1 text-left">Shipping Info</h3>
            <p className="text-xs text-orange-700 text-left">Please provide your details for the WhatsApp order.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 text-left">Your Name</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 text-left">Mobile Number</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 text-left">Full Address</label>
              <textarea 
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                placeholder="Building, Street, Area, Landmark..."
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-4 text-left">Delivery Method</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setFormData(p => ({ ...p, deliveryMethod: 'home' }))}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.deliveryMethod === 'home' ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
              >
                <i className="fas fa-truck text-lg"></i>
                <span className="font-black text-[10px] uppercase tracking-tighter">Delivery</span>
              </button>
              <button 
                onClick={() => setFormData(p => ({ ...p, deliveryMethod: 'pickup' }))}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.deliveryMethod === 'pickup' ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
              >
                <i className="fas fa-store text-lg"></i>
                <span className="font-black text-[10px] uppercase tracking-tighter">Pickup</span>
              </button>
            </div>
          </div>

          <button 
            disabled={!isFormValid}
            onClick={nextStep}
            className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all uppercase tracking-widest text-sm ${isFormValid ? 'bg-orange-600 text-white active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            Review Payment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-orange-50/50 p-4 rounded-2xl text-left">
            <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest mb-1">Payment Method</h3>
            <p className="text-xs text-orange-700">Finalize how you would like to pay.</p>
          </div>
          
          <div className="space-y-3">
            <label 
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentMethod === 'qr' ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-50' : 'border-gray-50 bg-gray-50'}`}
              onClick={() => setFormData(p => ({ ...p, paymentMethod: 'qr' }))}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'qr' ? 'border-orange-500' : 'border-gray-300'}`}>
                {formData.paymentMethod === 'qr' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
              </div>
              <div className="flex-1 text-left">
                <span className="font-black text-gray-900 block text-sm uppercase tracking-tight">Scan QR Code</span>
                <span className="text-[10px] text-gray-500 font-medium">Auto-fills ₹{total} in your UPI app</span>
              </div>
              <i className="fas fa-qrcode text-xl text-orange-600"></i>
            </label>

            <label 
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-50' : 'border-gray-50 bg-gray-50'}`}
              onClick={() => setFormData(p => ({ ...p, paymentMethod: 'cod' }))}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'border-orange-500' : 'border-gray-300'}`}>
                {formData.paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
              </div>
              <div className="flex-1 text-left">
                <span className="font-black text-gray-900 block text-sm uppercase tracking-tight">Cash on Delivery</span>
                <span className="text-[10px] text-gray-500 font-medium">Pay when order arrives</span>
              </div>
              <i className="fas fa-money-bill-wave text-xl text-gray-400"></i>
            </label>
          </div>

          {formData.paymentMethod === 'qr' && (
            <div className="bg-white p-6 rounded-3xl border border-dashed border-orange-200 text-center shadow-sm">
              <div className="bg-red-50 p-4 rounded-2xl mb-6 border border-red-100 animate-pulse">
                <p className="text-[11px] font-black text-red-600 uppercase leading-tight">
                  <i className="fas fa-camera mr-2"></i>
                  Send screenshot of payment, otherwise order will not be accepted
                </p>
              </div>
              <p className="text-[10px] font-black text-orange-900 mb-4 uppercase tracking-widest">Amount to Pay: ₹{total}</p>
              <img src={generateDynamicQR()} alt="Shop QR Code" className="mx-auto w-44 h-44 mb-4 rounded-xl border-4 border-white shadow-lg" />
              <div className="bg-orange-50/50 p-3 rounded-xl text-[10px] text-orange-800 font-bold uppercase tracking-tighter">
                <i className="fas fa-magic mr-2"></i>
                Amount is pre-filled. Just scan and pay!
              </div>
            </div>
          )}

          <div className="pt-6">
             <button 
              onClick={() => onSubmit(formData as UserDetails)}
              className="w-full bg-green-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <i className="fab fa-whatsapp text-xl"></i>
              SEND ORDER ON WHATSAPP
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-4 uppercase font-bold tracking-widest">
              Direct Order to 9867637326
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutForm;