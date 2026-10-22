import React, { useState } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Home, Building2 } from 'lucide-react';
import { useAuth, useToast } from '../../../store/StoreContext';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';

export default function AccountAddresses() {
  const { user, addAddress, deleteAddress, setDefaultAddress } = useAuth();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: 'Phnom Penh',
    province: 'Phnom Penh',
    postalCode: '120101',
    isDefault: false
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAddress.address.trim() || !newAddress.fullName.trim() || !newAddress.phone.trim()) {
      addToast('Please fill all required address fields', 'error');
      return;
    }

    addAddress(newAddress);
    setIsModalOpen(false);
    setNewAddress({
      label: 'Home',
      fullName: user?.name || '',
      phone: user?.phone || '',
      address: '',
      city: 'Phnom Penh',
      province: 'Phnom Penh',
      postalCode: '120101',
      isDefault: false
    });
    addToast('New address saved to your address book', 'success');
  };

  const addresses = user?.addresses || [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Saved Delivery Addresses</h2>
          <p className="text-xs text-slate-500">
            Manage your preferred drop-off locations across Phnom Penh and provinces.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Address</span>
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-500">No saved addresses found. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-blue-600 bg-blue-50/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{addr.label || 'Address'}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      deleteAddress(addr.id);
                      addToast('Address removed', 'info');
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs font-bold text-slate-800">{addr.fullName}</p>
                <p className="text-xs text-slate-500">{addr.phone}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {addr.address}, {addr.city}, {addr.province} {addr.postalCode}
                </p>
              </div>

              {!addr.isDefault && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultAddress(addr.id);
                      addToast('Default address updated', 'success');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Set as default
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Delivery Address"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNewAddress({ ...newAddress, label: 'Home' })}
              className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                newAddress.label === 'Home'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <button
              type="button"
              onClick={() => setNewAddress({ ...newAddress, label: 'Work / Studio' })}
              className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                newAddress.label === 'Work / Studio'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Work / Studio</span>
            </button>
          </div>

          <Input
            label="Full Name *"
            value={newAddress.fullName}
            onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
            required
          />

          <Input
            label="Contact Phone *"
            value={newAddress.phone}
            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
            required
          />

          <Input
            label="Street Address / Room / Floor *"
            placeholder="e.g. #14B, St. 310"
            value={newAddress.address}
            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City / Khan *"
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              required
            />
            <Input
              label="Province *"
              value={newAddress.province}
              onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={newAddress.isDefault}
              onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Make this my default shipping address</span>
          </label>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
