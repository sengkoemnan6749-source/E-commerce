import { INITIAL_USER } from './mockData';

const USER_KEY = 'techtonic_user';
const LOGGED_OUT_KEY = 'techtonic_logged_out';

function getStoredUser() {
  try {
    if (localStorage.getItem(LOGGED_OUT_KEY) === 'true') {
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
    return INITIAL_USER;
  } catch {
    return null;
  }
}

function saveStoredUser(user) {
  try {
    if (user) {
      localStorage.removeItem(LOGGED_OUT_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.setItem(LOGGED_OUT_KEY, 'true');
    }
  } catch (e) {
    console.error('Failed to save user:', e);
  }
}

export const ADMIN_USER = {
  id: 'usr-admin-01',
  fullName: 'Alex Vance (Store Admin)',
  name: 'Alex Vance',
  email: 'admin@techtonic.dev',
  phone: '+855 12 999 888',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  role: 'admin',
  memberSince: 'October 2024',
  savedAddresses: [
    {
      id: 'addr-admin-1',
      title: 'TechTonic Operations Center',
      isDefault: true,
      fullName: 'Alex Vance',
      phone: '+855 12 999 888',
      address: 'Vattanac Capital Tower, Level 18',
      city: 'Khan Daun Penh',
      province: 'Phnom Penh',
      postalCode: '120211'
    }
  ]
};

export const authService = {
  getCurrentUser() {
    return getStoredUser();
  },

  login(email, password) {
    try {
      localStorage.removeItem(LOGGED_OUT_KEY);
    } catch {}
    const isAdmin = Boolean(email && email.toLowerCase().includes('admin'));
    const template = isAdmin ? ADMIN_USER : INITIAL_USER;
    const user = {
      ...template,
      email: email || template.email,
      role: isAdmin ? 'admin' : 'customer'
    };
    saveStoredUser(user);
    return user;
  },

  loginAsCustomer() {
    try {
      localStorage.removeItem(LOGGED_OUT_KEY);
    } catch {}
    saveStoredUser(INITIAL_USER);
    return INITIAL_USER;
  },

  loginAsAdmin() {
    try {
      localStorage.removeItem(LOGGED_OUT_KEY);
    } catch {}
    saveStoredUser(ADMIN_USER);
    return ADMIN_USER;
  },

  register(userData) {
    try {
      localStorage.removeItem(LOGGED_OUT_KEY);
    } catch {}
    const displayName = userData.fullName || userData.name || 'Valued Customer';
    const newUser = {
      id: `usr-${Date.now()}`,
      fullName: displayName,
      name: displayName,
      email: userData.email,
      phone: userData.phone || '+855 12 000 000',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      role: 'customer',
      memberSince: 'Today',
      savedAddresses: []
    };
    saveStoredUser(newUser);
    return newUser;
  },

  logout() {
    saveStoredUser(null);
  },

  updateProfile(updatedData) {
    const current = getStoredUser() || INITIAL_USER;
    const merged = { ...current, ...updatedData };
    saveStoredUser(merged);
    return merged;
  },

  saveAddress(newAddr) {
    const user = getStoredUser() || INITIAL_USER;
    const addresses = user.savedAddresses || [];
    if (newAddr.isDefault) {
      addresses.forEach(a => a.isDefault = false);
    }
    addresses.push({ ...newAddr, id: `addr-${Date.now()}` });
    user.savedAddresses = addresses;
    saveStoredUser(user);
    return user;
  },

  deleteAddress(addrId) {
    const user = getStoredUser() || INITIAL_USER;
    user.savedAddresses = (user.savedAddresses || []).filter(a => a.id !== addrId);
    saveStoredUser(user);
    return user;
  }
};
