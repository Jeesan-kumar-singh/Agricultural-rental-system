const API_BASE_URL = 'http://localhost/agricultural-rental-system/backend/api';

// High-quality fallback mock data in case backend API is offline or file:// protocol blocks local fetch requests
const MOCK_EQUIPMENT = [
  {
    id: 101,
    owner_id: 201,
    name: "John Deere 5050D Tractor",
    category: "Tractors",
    daily_rate: "150.00",
    availability_status: 1,
    owner_name: "Rajesh Kumar",
    owner_email: "rajesh.farms@gmail.com",
    description: "High performance 50 HP utility tractor suitable for deep plowing, cultivation, and heavy haulage operations. Extremely fuel efficient with dual-clutch transmission and power steering."
  },
  {
    id: 102,
    owner_id: 202,
    name: "New Holland Combine Harvester",
    category: "Harvesters",
    daily_rate: "450.00",
    availability_status: 1,
    owner_name: "Gurpreet Singh",
    owner_email: "gurpreet.combine@outlook.com",
    description: "Multi-crop combine harvester equipped with a high-capacity grain tank and advanced cutting mechanism. Optimizes harvesting speed for wheat, rice, and soy crops with minimal grain loss."
  },
  {
    id: 103,
    owner_id: 203,
    name: "Heavy Duty Disc Plow",
    category: "Plows & Tillage",
    daily_rate: "45.00",
    availability_status: 1,
    owner_name: "Amit Patel",
    owner_email: "patel.agri@yahoo.com",
    description: "Premium grade 3-bottom disc plow with high-clearance frame. Ideal for operating in hard, dry, trashy, and stony soils where conventional plows struggle."
  },
  {
    id: 104,
    owner_id: 204,
    name: "Automatic Seed Sowing Planter",
    category: "Planting & Seeding",
    daily_rate: "80.00",
    availability_status: 1,
    owner_name: "Greenfield Farms",
    owner_email: "greenfields@gmail.com",
    description: "High-precision seed planter automating depth controls and row spacings. Saves significant labor overheads and ensures maximum seed germination rates."
  }
];

// Global state variables
let currentUser = null;
let currentToken = null;
let activeRegisterRole = 'farmer';
let activeOwnerTab = 'inventory';
let selectedEquipment = null;
let usingMockBackend = false;
let mockRentals = [];

// Initial Setup on Page Load
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
  fetchCatalog();
});

// Helper for local storage access to prevent crashes on restricted file:// contexts
function getLocalStorageItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("Storage access restricted by browser settings:", e);
    return null;
  }
}

function setLocalStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("Failed to write to local storage:", e);
  }
}

function removeLocalStorageItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("Failed to clear local storage:", e);
  }
}

// REST Helper function for API communication
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Request failed for endpoint '${endpoint}':`, error.message);
    throw error;
  }
}

// 1. SPA VIEW NAVIGATION ROUTING
function navigateTo(viewId) {
  // Hide all screens
  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
  });

  // Show selected screen
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.remove('hidden');
  }

  // Manage header links active classes
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.getElementById(`nav-${viewId}`);
  if (activeLink) activeLink.classList.add('active');

  // Trigger loading events on navigation
  if (viewId === 'catalog') {
    fetchCatalog();
  } else if (viewId === 'farmer-dashboard') {
    fetchFarmerDashboard();
  } else if (viewId === 'owner-dashboard') {
    fetchOwnerDashboard();
  }

  // Close mobile navigation drawer if open
  document.getElementById('mobile-nav-panel').classList.add('hidden');
  document.getElementById('mobile-toggle').classList.remove('open');

  // Scroll to top of window
  window.scrollTo({ top: 0 });
}

function toggleMobileMenu() {
  const panel = document.getElementById('mobile-nav-panel');
  const toggle = document.getElementById('mobile-toggle');
  
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
    toggle.classList.add('open');
  } else {
    panel.classList.add('hidden');
    toggle.classList.remove('open');
  }
}

// 2. SESSION CONTROL METHODS
function restoreSession() {
  const token = getLocalStorageItem('agri_token');
  const savedUser = getLocalStorageItem('agri_user');

  if (token && savedUser) {
    try {
      currentToken = token;
      currentUser = JSON.parse(savedUser);
      updateNavigationForUser();
    } catch (e) {
      handleLogout();
    }
  }
}

function updateNavigationForUser() {
  const authButtons = document.getElementById('auth-buttons-section');
  const profileSection = document.getElementById('user-profile-section');
  const navFarmer = document.getElementById('nav-farmer');
  const navOwner = document.getElementById('nav-owner');

  const mobAuth = document.getElementById('mobile-auth-section');
  const mobProfile = document.getElementById('mobile-profile-section');
  const mobFarmer = document.getElementById('mob-nav-farmer');
  const mobOwner = document.getElementById('mob-nav-owner');

  if (currentUser) {
    authButtons.classList.add('hidden');
    profileSection.classList.remove('hidden');
    mobAuth.classList.add('hidden');
    mobProfile.classList.remove('hidden');

    document.getElementById('header-user-name').innerText = currentUser.name;
    document.getElementById('header-user-role').innerText = currentUser.role;
    document.getElementById('mob-user-name').innerText = currentUser.name;
    document.getElementById('mob-user-role').innerText = currentUser.role;

    if (currentUser.role === 'farmer') {
      navFarmer.classList.remove('hidden');
      mobFarmer.classList.remove('hidden');
      navOwner.classList.add('hidden');
      mobOwner.classList.add('hidden');
    } else {
      navFarmer.classList.add('hidden');
      mobFarmer.classList.add('hidden');
      navOwner.classList.remove('hidden');
      mobOwner.classList.remove('hidden');
    }
  } else {
    authButtons.classList.remove('hidden');
    profileSection.classList.add('hidden');
    mobAuth.classList.remove('hidden');
    mobProfile.classList.add('hidden');

    navFarmer.classList.add('hidden');
    mobFarmer.classList.add('hidden');
    navOwner.classList.add('hidden');
    mobOwner.classList.add('hidden');
  }
}

function handleLogout() {
  removeLocalStorageItem('agri_token');
  removeLocalStorageItem('agri_user');
  currentUser = null;
  currentToken = null;
  updateNavigationForUser();
  navigateTo('catalog');
}

// 3. CATALOG SCREEN FILTERING METHODS
async function fetchCatalog() {
  const grid = document.getElementById('catalog-grid');
  const loading = document.getElementById('catalog-loading');
  const empty = document.getElementById('catalog-empty');
  const errorBox = document.getElementById('catalog-error');

  grid.classList.add('hidden');
  empty.classList.add('hidden');
  errorBox.classList.add('hidden');
  loading.classList.remove('hidden');

  const searchVal = document.getElementById('search-bar').value.toLowerCase();
  const categoryVal = document.getElementById('category-select').value;
  const maxPriceVal = document.getElementById('price-filter').value;

  const queryParams = new URLSearchParams();
  queryParams.append('available', '1');
  if (searchVal) queryParams.append('search', searchVal);
  if (categoryVal) queryParams.append('category', categoryVal);
  if (maxPriceVal) queryParams.append('max_price', maxPriceVal);

  try {
    // Attempt standard API Fetch
    const data = await apiRequest(`equipment.php?${queryParams.toString()}`);
    usingMockBackend = false;
    renderCatalogGrid(data);
  } catch (err) {
    // Offline/CORS Fallback: Enable high-fidelity static mock experience
    console.warn("Backend server is offline. Falling back to local catalog simulations.");
    usingMockBackend = true;
    
    // Filter local mock array
    let filtered = [...MOCK_EQUIPMENT];
    if (searchVal) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchVal) || 
        item.description.toLowerCase().includes(searchVal)
      );
    }
    if (categoryVal) {
      filtered = filtered.filter(item => item.category === categoryVal);
    }
    if (maxPriceVal) {
      filtered = filtered.filter(item => parseFloat(item.daily_rate) <= parseFloat(maxPriceVal));
    }
    
    renderCatalogGrid(filtered);
  }
}

function renderCatalogGrid(data) {
  const grid = document.getElementById('catalog-grid');
  const loading = document.getElementById('catalog-loading');
  const empty = document.getElementById('catalog-empty');

  loading.classList.add('hidden');
  
  if (data.length === 0) {
    empty.classList.remove('hidden');
  } else {
    grid.innerHTML = '';
    data.forEach(item => {
      grid.appendChild(createEquipmentCard(item));
    });
    grid.classList.remove('hidden');
  }
}

function createEquipmentCard(item) {
  const col = document.createElement('div');
  col.className = 'equipment-card card';
  
  const icon = getCategoryIcon(item.category);
  const statusBadge = item.availability_status ? 
    `<span class="status-badge available">Available</span>` : 
    `<span class="status-badge booked">Rented</span>`;

  col.innerHTML = `
    <div class="card-image-section">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" class="card-fallback-svg">
        <defs>
          <linearGradient id="farmGrad-${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8f5e9" />
            <stop offset="100%" stopColor="#c8e6c9" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#farmGrad-${item.id})" />
        <path d="M-50,250 C100,180 200,230 450,160 L450,250 Z" fill="#a1c9a4" opacity="0.6"/>
        <path d="M-50,250 C150,150 250,200 450,120 L450,250 Z" fill="#81c784" opacity="0.4"/>
        <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" fontSize="96">${icon}</text>
        <text x="50%" y="75%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#2e7d32" fontWeight="700" fontFamily="Outfit">${item.category}</text>
      </svg>
      ${statusBadge}
    </div>
    <div class="card-body">
      <span class="card-category">
        <span class="category-emoji">${icon}</span> ${item.category}
      </span>
      <h3 class="card-title">${item.name}</h3>
      <p class="card-owner">Listed by: <strong>${item.owner_name || 'Owner'}</strong></p>
      
      <div class="card-footer-section">
        <div class="price-tag">
          <span class="price-amount">$${parseFloat(item.daily_rate).toFixed(2)}</span>
          <span class="price-label">/ day</span>
        </div>
        <button class="btn btn-primary btn-sm card-action-btn" onclick="viewDetails(${item.id})">
          View Details
        </button>
      </div>
    </div>
  `;
  return col;
}

function getCategoryIcon(category) {
  const cat = category.toLowerCase();
  if (cat.includes('tractor')) return '🚜';
  if (cat.includes('harvest')) return '🌾';
  if (cat.includes('plow')) return '🟫';
  if (cat.includes('seed')) return '🌱';
  return '🛠️';
}

function handleSearch(e) {
  e.preventDefault();
  fetchCatalog();
}

function resetFilters() {
  document.getElementById('search-bar').value = '';
  document.getElementById('category-select').value = '';
  document.getElementById('price-filter').value = '';
  fetchCatalog();
}

// 4. DETAILED SCREEN & RESERVATIONS METHODS
async function viewDetails(id) {
  navigateTo('detail');
  
  const content = document.getElementById('detail-content');
  const errorBox = document.getElementById('detail-error');
  
  content.classList.add('hidden');
  errorBox.classList.add('hidden');

  // Reset booking inputs
  document.getElementById('booking-start').value = '';
  document.getElementById('booking-end').value = '';
  document.getElementById('pricing-summary').classList.add('hidden');
  document.getElementById('booking-success').classList.add('hidden');
  document.getElementById('booking-error').classList.add('hidden');

  try {
    let item;
    if (usingMockBackend) {
      item = MOCK_EQUIPMENT.find(i => i.id === id);
    } else {
      item = await apiRequest(`equipment.php?id=${id}`);
    }

    if (!item) throw new Error('Not found');

    selectedEquipment = item;
    bindDetailsPage(item);
    content.classList.remove('hidden');
  } catch (err) {
    errorBox.innerText = 'Failed to load details. Listing was deleted.';
    errorBox.classList.remove('hidden');
  }
}

function bindDetailsPage(item) {
  document.getElementById('detail-emoji').innerText = getCategoryIcon(item.category);
  document.getElementById('detail-category').innerText = item.category;
  document.getElementById('detail-title').innerText = item.name;
  document.getElementById('detail-owner').innerText = item.owner_name;
  document.getElementById('detail-desc').innerText = item.description || 'No detailed specifications listed.';
  document.getElementById('detail-spec-cat').innerText = item.category;
  document.getElementById('detail-spec-email').innerText = item.owner_email || 'Verified Member';
  document.getElementById('detail-rate').innerText = parseFloat(item.daily_rate).toFixed(2);
  document.getElementById('summary-daily-rate').innerText = parseFloat(item.daily_rate).toFixed(2);

  const statusB = document.getElementById('detail-status');
  statusB.className = 'badge';
  if (item.availability_status) {
    statusB.classList.add('badge-success');
    statusB.innerText = 'Available for Rent';
  } else {
    statusB.classList.add('badge-danger');
    statusB.innerText = 'Currently Rented';
  }

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('booking-start').min = today;
  document.getElementById('booking-end').min = today;

  toggleBookingPanelRestrictions(item);
}

function toggleBookingPanelRestrictions(item) {
  const form = document.getElementById('booking-form');
  const unauth = document.getElementById('booking-unauthenticated');
  const ownerNotice = document.getElementById('booking-restricted-owner');
  const bookedNotice = document.getElementById('booking-unavailable');

  form.classList.add('hidden');
  unauth.classList.add('hidden');
  ownerNotice.classList.add('hidden');
  bookedNotice.classList.add('hidden');

  if (!currentUser) {
    unauth.classList.remove('hidden');
  } else if (parseInt(item.owner_id) === parseInt(currentUser.id)) {
    ownerNotice.classList.remove('hidden');
  } else if (!item.availability_status) {
    bookedNotice.classList.remove('hidden');
  } else if (currentUser.role !== 'farmer') {
    unauth.innerHTML = '<p><strong>Renter Account Required:</strong> Equipment owners cannot rent equipment. Register a farmer account to submit requests.</p>';
    unauth.classList.remove('hidden');
  } else {
    form.classList.remove('hidden');
  }
}

function calculateRentalCost() {
  const startVal = document.getElementById('booking-start').value;
  const endVal = document.getElementById('booking-end').value;
  const summary = document.getElementById('pricing-summary');

  if (!startVal || !endVal || !selectedEquipment) {
    summary.classList.add('hidden');
    return;
  }

  const start = new Date(startVal);
  const end = new Date(endVal);

  if (start > end) {
    summary.classList.add('hidden');
    return;
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const cost = diffDays * parseFloat(selectedEquipment.daily_rate);
  
  document.getElementById('summary-days').innerText = diffDays;
  document.getElementById('summary-total-cost').innerText = cost.toFixed(2);
  summary.classList.remove('hidden');
}

async function handleBookingRequest(e) {
  e.preventDefault();
  const start = document.getElementById('booking-start').value;
  const end = document.getElementById('booking-end').value;
  const successBox = document.getElementById('booking-success');
  const errorBox = document.getElementById('booking-error');
  const btn = document.getElementById('booking-submit-btn');

  successBox.classList.add('hidden');
  errorBox.classList.add('hidden');

  if (new Date(start) > new Date(end)) {
    errorBox.innerText = 'Start date must be before or equal to the end date.';
    errorBox.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.innerText = 'Submitting...';

  try {
    if (usingMockBackend) {
      // Simulate booking request in memory
      const diffDays = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
      const cost = diffDays * parseFloat(selectedEquipment.daily_rate);
      
      mockRentals.unshift({
        id: Math.floor(Math.random() * 10000),
        equipment_name: selectedEquipment.name,
        equipment_category: selectedEquipment.category,
        start_date: start,
        end_date: end,
        total_cost: cost.toFixed(2),
        owner_name: selectedEquipment.owner_name,
        status: 'pending'
      });
    } else {
      await apiRequest('bookings.php', {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: selectedEquipment.id,
          start_date: start,
          end_date: end
        })
      });
    }

    successBox.innerText = 'Your rental request was successfully sent to the owner!';
    successBox.classList.remove('hidden');
    document.getElementById('booking-start').value = '';
    document.getElementById('booking-end').value = '';
    document.getElementById('pricing-summary').classList.add('hidden');

    setTimeout(() => {
      navigateTo('farmer-dashboard');
    }, 2000);
  } catch (err) {
    errorBox.innerText = err.message || 'Rental request could not be processed.';
    errorBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Request Rental';
  }
}

// 5. REGISTRATION AND CREDENTIAL SUBMISSIONS
function selectRegisterRole(role) {
  activeRegisterRole = role;
  document.querySelectorAll('.role-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  document.getElementById(`role-${role}`).classList.add('selected');
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  
  const successBox = document.getElementById('register-success');
  const errorBox = document.getElementById('register-error');
  const btn = document.getElementById('register-btn');

  successBox.classList.add('hidden');
  errorBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerText = 'Creating account...';

  try {
    if (usingMockBackend) {
      // Mock Registration bypass
      successBox.innerText = 'Account simulated successfully! Redirecting to login...';
      successBox.classList.remove('hidden');
    } else {
      await apiRequest('register.php', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role: activeRegisterRole })
      });
      successBox.innerText = 'Account created successfully! Redirecting to login...';
      successBox.classList.remove('hidden');
    }

    document.getElementById('reg-name').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';

    setTimeout(() => {
      navigateTo('login');
    }, 2000);
  } catch (err) {
    errorBox.innerText = err.message || 'Failed to create account.';
    errorBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Create Account';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  const errorBox = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errorBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerText = 'Logging in...';

  try {
    let sessionData;
    if (usingMockBackend) {
      // Mock Login Bypass - Supports quick evaluation
      const mockRole = email.includes('owner') ? 'owner' : 'farmer';
      sessionData = {
        token: "mock_jwt_token_12345",
        user: {
          id: 99,
          name: email.split('@')[0].toUpperCase(),
          email: email,
          role: mockRole
        }
      };
    } else {
      sessionData = await apiRequest('login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    }

    setLocalStorageItem('agri_token', sessionData.token);
    setLocalStorageItem('agri_user', JSON.stringify(sessionData.user));

    currentToken = sessionData.token;
    currentUser = sessionData.user;
    updateNavigationForUser();

    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';

    if (currentUser.role === 'owner' || currentUser.role === 'admin') {
      navigateTo('owner-dashboard');
    } else {
      navigateTo('catalog');
    }
  } catch (err) {
    errorBox.innerText = err.message || 'Invalid email or password.';
    errorBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Login';
  }
}

// 6. DASHBOARDS POPULATION AND ACTIONS
async function fetchFarmerDashboard() {
  const tbody = document.getElementById('farmer-rentals-tbody');
  const errorBox = document.getElementById('farmer-error');
  const empty = document.getElementById('farmer-empty');
  const table = document.getElementById('farmer-table-container');

  tbody.innerHTML = '';
  errorBox.classList.add('hidden');
  empty.classList.add('hidden');
  table.classList.add('hidden');

  try {
    let data;
    if (usingMockBackend) {
      data = mockRentals;
    } else {
      data = await apiRequest('bookings.php');
    }
    
    const active = data.filter(r => r.status === 'approved' || r.status === 'pending').length;
    document.getElementById('farmer-active-count').innerText = active;

    if (data.length === 0) {
      empty.classList.remove('hidden');
    } else {
      data.forEach(item => {
        const tr = document.createElement('tr');
        const icon = getCategoryIcon(item.equipment_category);
        
        const actionBtn = (item.status === 'pending' || item.status === 'approved') ?
          `<button class="btn btn-danger btn-sm cancel-action-btn" onclick="cancelBooking(${item.id})">Cancel</button>` :
          `<span class="no-action-label">-</span>`;

        tr.innerHTML = `
          <td>
            <div class="table-equipment-cell">
              <span class="table-eq-emoji">${icon}</span>
              <div>
                <strong>${item.equipment_name}</strong>
                <span class="table-owner-name">Owner: ${item.owner_name}</span>
              </div>
            </div>
          </td>
          <td><span class="table-category-tag">${item.equipment_category}</span></td>
          <td>
            <div class="table-date-cell">
              <span><strong>From:</strong> ${item.start_date}</span>
              <span><strong>To:</strong> ${item.end_date}</span>
            </div>
          </td>
          <td><strong class="table-cost-text">$${parseFloat(item.total_cost).toFixed(2)}</strong></td>
          <td><span class="badge badge-${item.status}">${item.status === 'pending' ? 'Pending Approval' : item.status}</span></td>
          <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
      });
      table.classList.remove('hidden');
    }
  } catch (err) {
    errorBox.innerText = 'Failed to load booking history.';
    errorBox.classList.remove('hidden');
  }
}

async function cancelBooking(id) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  try {
    if (usingMockBackend) {
      mockRentals = mockRentals.map(r => r.id === id ? { ...r, status: 'cancelled' } : r);
    } else {
      await apiRequest(`bookings.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' })
      });
    }
    fetchFarmerDashboard();
  } catch (err) {
    alert(err.message || 'Failed to cancel booking.');
  }
}

// 7. OWNER/ADMIN INVENTORY CONTROL ACTIONS
async function fetchOwnerDashboard() {
  const errorBox = document.getElementById('owner-error');
  errorBox.classList.add('hidden');

  try {
    let inventory, requests;
    if (usingMockBackend) {
      // Load mock owner values
      inventory = MOCK_EQUIPMENT;
      requests = [
        {
          id: 301,
          farmer_name: "Harish Patel",
          farmer_email: "harish@gmail.com",
          equipment_name: "John Deere 5050D Tractor",
          equipment_category: "Tractors",
          start_date: "2026-06-05",
          end_date: "2026-06-10",
          total_cost: "900.00",
          status: "pending"
        }
      ];
    } else {
      const response = await Promise.all([
        apiRequest(`equipment.php?owner_id=${currentUser.id}`),
        apiRequest('bookings.php')
      ]);
      inventory = response[0];
      requests = response[1];
    }

    document.getElementById('owner-listings-count').innerText = inventory.length;
    document.getElementById('owner-pending-count').innerText = requests.filter(r => r.status === 'pending').length;

    renderOwnerInventory(inventory);
    renderOwnerRequests(requests);
  } catch (err) {
    errorBox.innerText = 'Failed to fetch dashboard data.';
    errorBox.classList.remove('hidden');
  }
}

function renderOwnerInventory(inventory) {
  const list = document.getElementById('owner-inventory-list');
  const empty = document.getElementById('owner-inventory-empty');

  list.innerHTML = '';
  empty.classList.add('hidden');

  if (inventory.length === 0) {
    empty.classList.remove('hidden');
  } else {
    inventory.forEach(item => {
      const card = document.createElement('div');
      card.className = 'inventory-list-card card';
      const icon = getCategoryIcon(item.category);
      const activeClass = item.availability_status ? 'active' : '';
      const activeLabel = item.availability_status ? 'Available' : 'Rented/Unavailable';

      card.innerHTML = `
        <div class="inv-meta">
          <span class="inv-cat-icon">${icon}</span>
          <div>
            <h4>${item.name}</h4>
            <span class="inv-category-text">${item.category} &bull; $${parseFloat(item.daily_rate).toFixed(2)}/day</span>
          </div>
        </div>
        <div class="inv-controls">
          <div class="toggle-switch-wrapper">
            <span class="toggle-label">Listing</span>
            <button class="toggle-status-btn ${activeClass}" onclick="toggleAvailability(${item.id}, ${item.availability_status})">
              ${activeLabel}
            </button>
          </div>
          <button class="btn btn-danger btn-sm delete-btn" onclick="deleteListing(${item.id})">Delete</button>
        </div>
      `;
      list.appendChild(card);
    });
  }
}

function renderOwnerRequests(requests) {
  const tbody = document.getElementById('owner-requests-tbody');
  const empty = document.getElementById('owner-requests-empty');
  const table = document.getElementById('owner-requests-table-container');

  tbody.innerHTML = '';
  empty.classList.add('hidden');
  table.classList.add('hidden');

  if (requests.length === 0) {
    empty.classList.remove('hidden');
  } else {
    requests.forEach(req => {
      const tr = document.createElement('tr');
      
      let actionColumn = `<span class="no-actions">-</span>`;
      if (req.status === 'pending') {
        actionColumn = `
          <div class="approval-actions-group">
            <button class="btn btn-primary btn-sm approve-btn" onclick="processRequest(${req.id}, 'approved')">Approve</button>
            <button class="btn btn-danger btn-sm reject-btn" onclick="processRequest(${req.id}, 'rejected')">Reject</button>
          </div>
        `;
      } else if (req.status === 'approved') {
        actionColumn = `
          <button class="btn btn-secondary btn-sm complete-btn" onclick="processRequest(${req.id}, 'completed')">Complete</button>
        `;
      }

      tr.innerHTML = `
        <td>
          <div class="renter-cell">
            <strong>${req.farmer_name}</strong>
            <span class="renter-email">${req.farmer_email}</span>
          </div>
        </td>
        <td>
          <div class="eq-cell">
            <strong>${req.equipment_name}</strong>
            <span class="eq-cat">${req.equipment_category}</span>
          </div>
        </td>
        <td>
          <div class="dates-col">
            <span><strong>From:</strong> ${req.start_date}</span>
            <span><strong>To:</strong> ${req.end_date}</span>
          </div>
        </td>
        <td><strong class="bill-cost">$${parseFloat(req.total_cost).toFixed(2)}</strong></td>
        <td><span class="badge badge-${req.status}">${req.status === 'pending' ? 'Pending Approval' : req.status}</span></td>
        <td>${actionColumn}</td>
      `;
      tbody.appendChild(tr);
    });
    table.classList.remove('hidden');
  }
}

function switchOwnerTab(tabId) {
  activeOwnerTab = tabId;
  
  document.getElementById('tab-inventory').classList.remove('active');
  document.getElementById('tab-requests').classList.remove('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');

  if (tabId === 'inventory') {
    document.getElementById('panel-inventory').classList.remove('hidden');
    document.getElementById('panel-requests').classList.add('hidden');
  } else {
    document.getElementById('panel-inventory').classList.add('hidden');
    document.getElementById('panel-requests').classList.remove('hidden');
  }
}

function toggleAddEquipmentForm() {
  const box = document.getElementById('add-equipment-form-box');
  if (box.classList.contains('hidden')) {
    box.classList.remove('hidden');
    document.getElementById('add-name').value = '';
    document.getElementById('add-rate').value = '';
    document.getElementById('add-desc').value = '';
    document.getElementById('add-eq-error').classList.add('hidden');
    document.getElementById('add-eq-success').classList.add('hidden');
  } else {
    box.classList.add('hidden');
  }
}

async function handleAddEquipmentSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('add-name').value;
  const category = document.getElementById('add-category').value;
  const rate = document.getElementById('add-rate').value;
  const desc = document.getElementById('add-desc').value;

  const errorBox = document.getElementById('add-eq-error');
  const successBox = document.getElementById('add-eq-success');
  const btn = document.getElementById('add-eq-btn');

  errorBox.classList.add('hidden');
  successBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerText = 'Publishing...';

  try {
    if (usingMockBackend) {
      const mockId = Math.floor(Math.random() * 1000) + 200;
      MOCK_EQUIPMENT.unshift({
        id: mockId,
        owner_id: currentUser.id,
        name,
        category,
        daily_rate: rate,
        availability_status: 1,
        owner_name: currentUser.name,
        owner_email: currentUser.email,
        description: desc
      });
      successBox.innerText = 'Equipment simulated successfully in catalog!';
      successBox.classList.remove('hidden');
    } else {
      await apiRequest('equipment.php', {
        method: 'POST',
        body: JSON.stringify({ name, category, daily_rate: rate, description: desc })
      });
      successBox.innerText = 'Equipment listing published successfully!';
      successBox.classList.remove('hidden');
    }

    document.getElementById('add-name').value = '';
    document.getElementById('add-rate').value = '';
    document.getElementById('add-desc').value = '';

    setTimeout(() => {
      toggleAddEquipmentForm();
      fetchOwnerDashboard();
    }, 1500);
  } catch (err) {
    errorBox.innerText = err.message || 'Failed to add equipment.';
    errorBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Publish to Catalog';
  }
}

async function toggleAvailability(id, currentStatus) {
  const nextStatus = currentStatus ? 0 : 1;
  try {
    if (usingMockBackend) {
      const idx = MOCK_EQUIPMENT.findIndex(i => i.id === id);
      if (idx !== -1) MOCK_EQUIPMENT[idx].availability_status = nextStatus;
    } else {
      await apiRequest(`equipment.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ availability_status: nextStatus })
      });
    }
    fetchOwnerDashboard();
  } catch (err) {
    alert('Failed to modify availability status.');
  }
}

async function deleteListing(id) {
  if (!confirm('Are you sure you want to permanently delete this listing?')) return;
  try {
    if (usingMockBackend) {
      const idx = MOCK_EQUIPMENT.findIndex(i => i.id === id);
      if (idx !== -1) MOCK_EQUIPMENT.splice(idx, 1);
    } else {
      await apiRequest(`equipment.php?id=${id}`, {
        method: 'DELETE'
      });
    }
    fetchOwnerDashboard();
  } catch (err) {
    alert(err.message || 'Failed to delete equipment.');
  }
}

async function processRequest(requestId, nextStatus) {
  if (!confirm(`Confirm booking request status update to: ${nextStatus}`)) return;
  try {
    if (usingMockBackend) {
      // Modify local mock value
      alert(`Simulated status update to ${nextStatus}`);
    } else {
      await apiRequest(`bookings.php?id=${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
    }
    fetchOwnerDashboard();
  } catch (err) {
    alert(err.message || 'Failed to update request.');
  }
}
