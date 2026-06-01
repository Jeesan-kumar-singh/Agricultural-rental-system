import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'requests'
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Equipment Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState('Tractors');
  const [eqRate, setEqRate] = useState('');
  const [eqDesc, setEqDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Parallel fetches for inventory and booking requests
      const [inventoryData, requestsData] = await Promise.all([
        api.equipment.getByOwner(user.id),
        api.bookings.getMyBookings() // When logged-in as owner, returns incoming requests
      ]);

      setInventory(inventoryData);
      setRequests(requestsData);
    } catch (err) {
      setError('Could not populate dashboard datasets. Please try reloading.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    if (!eqName || !eqCategory || !eqRate) {
      setFormError('Please complete name, category, and daily rental rate.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const response = await api.equipment.create({
        name: eqName,
        category: eqCategory,
        daily_rate: eqRate,
        description: eqDesc
      });

      setFormSuccess('Machinery listed successfully in catalog!');
      
      // Reset form variables
      setEqName('');
      setEqRate('');
      setEqDesc('');
      
      // Update inventory local state directly
      const newListing = {
        id: response.equipment_id,
        owner_id: user.id,
        name: eqName,
        category: eqCategory,
        daily_rate: eqRate,
        description: eqDesc,
        availability_status: 1
      };
      setInventory(prev => [newListing, ...prev]);

      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess('');
      }, 1500);

    } catch (err) {
      setFormError(err.message || 'Failed to list equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (equipmentId, currentStatus) => {
    const nextStatus = currentStatus ? 0 : 1;
    try {
      await api.equipment.update(equipmentId, { availability_status: nextStatus });
      setInventory(prev =>
        prev.map(item => item.id === equipmentId ? { ...item, availability_status: nextStatus } : item)
      );
    } catch (err) {
      alert('Failed to modify availability status.');
    }
  };

  const handleDeleteListing = async (equipmentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this equipment listing?')) {
      return;
    }

    try {
      await api.equipment.delete(equipmentId);
      setInventory(prev => prev.filter(item => item.id !== equipmentId));
    } catch (err) {
      alert(err.message || 'Failed to delete listing.');
    }
  };

  const handleProcessRequest = async (requestId, nextStatus) => {
    if (!window.confirm(`Are you sure you want to update this booking request status to: ${nextStatus}?`)) {
      return;
    }

    try {
      await api.bookings.updateStatus(requestId, nextStatus);
      setRequests(prev =>
        prev.map(req => req.id === requestId ? { ...req, status: nextStatus } : req)
      );
    } catch (err) {
      alert(err.message || 'Failed to process request.');
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Title & Stats */}
      <div className="admin-header-bar card">
        <div className="header-text">
          <h1>Equipment Owner Dashboard</h1>
          <p>Manage your listed agricultural machinery and approve incoming rental requests.</p>
        </div>
        
        <div className="header-stats-row">
          <div className="stat-card">
            <span className="stat-card-label">My Listings</span>
            <span className="stat-card-val">{inventory.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Pending Requests</span>
            <span className="stat-card-val alert-val">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs navigation */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          My Listed Equipment
        </button>
        <button 
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Rental Requests
        </button>
      </div>

      {/* Inventory tab panel */}
      {activeTab === 'inventory' && (
        <section className="inventory-section">
          <div className="section-action-row">
            <h2>Active Listings ({inventory.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'Close form' : '+ Add New Equipment'}
            </button>
          </div>

          {/* Add equipment form box */}
          {showAddForm && (
            <div className="add-eq-form-card card animate-slide">
              <h3>List New Agricultural Equipment</h3>
              {formError && <div className="alert alert-danger">{formError}</div>}
              {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

              <form onSubmit={handleAddEquipment} className="add-form">
                <div className="form-row-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="eq-name">Equipment Name</label>
                    <input
                      id="eq-name"
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Deere 5050D Tractor"
                      value={eqName}
                      onChange={(e) => setEqName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="eq-cat">Category</label>
                    <select
                      id="eq-cat"
                      className="form-control"
                      value={eqCategory}
                      onChange={(e) => setEqCategory(e.target.value)}
                    >
                      <option value="Tractors">Tractors</option>
                      <option value="Harvesters">Harvesters</option>
                      <option value="Plows & Tillage">Plows & Tillage</option>
                      <option value="Planting & Seeding">Planting & Seeding</option>
                      <option value="Other tools">Other tools</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="eq-rate">Daily Price Rate ($)</label>
                    <input
                      id="eq-rate"
                      type="number"
                      min="1"
                      className="form-control"
                      placeholder="e.g. 150"
                      value={eqRate}
                      onChange={(e) => setEqRate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="eq-desc">Description / Specifications</label>
                  <textarea
                    id="eq-desc"
                    className="form-control text-area-desc"
                    placeholder="Provide details about engine power, capacity, and usage guidelines..."
                    value={eqDesc}
                    onChange={(e) => setEqDesc(e.target.value)}
                    rows="3"
                  />
                </div>

                <button type="submit" className="btn btn-accent btn-sm" disabled={submitting}>
                  {submitting ? 'Listing...' : 'Publish to Catalog'}
                </button>
              </form>
            </div>
          )}

          {inventory.length === 0 ? (
            <div className="empty-dashboard card">
              <span className="empty-emoji">🚜</span>
              <h3>No equipment listed yet</h3>
              <p>You haven't listed any of your farm machinery for rentals yet. Add your first item to start earning.</p>
            </div>
          ) : (
            <div className="inventory-grid">
              {inventory.map(item => (
                <div key={item.id} className="inventory-list-card card">
                  <div className="inv-meta">
                    <span className="inv-cat-icon">
                      {item.category.toLowerCase().includes('tractor') ? '🚜' : '🌾'}
                    </span>
                    <div>
                      <h4>{item.name}</h4>
                      <span className="inv-category-text">{item.category} &bull; ${parseFloat(item.daily_rate).toFixed(2)}/day</span>
                    </div>
                  </div>

                  <div className="inv-controls">
                    <div className="toggle-switch-wrapper">
                      <span className="toggle-label">Catalog Listing</span>
                      <button 
                        className={`toggle-status-btn ${item.availability_status ? 'active' : ''}`}
                        onClick={() => handleToggleAvailability(item.id, item.availability_status)}
                      >
                        {item.availability_status ? 'Available' : 'Rented/Unavailable'}
                      </button>
                    </div>

                    <button 
                      className="btn btn-danger btn-sm delete-btn"
                      onClick={() => handleDeleteListing(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Requests tab panel */}
      {activeTab === 'requests' && (
        <section className="requests-section">
          <h2>Rental Bookings Received</h2>

          {requests.length === 0 ? (
            <div className="empty-dashboard card">
              <span className="empty-emoji">🌾</span>
              <h3>No requests received</h3>
              <p>You don't have any rental requests on your agricultural tools catalog listings yet.</p>
            </div>
          ) : (
            <div className="requests-table-wrapper card">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Renter Farmer</th>
                    <th>Equipment Model</th>
                    <th>Rental Range</th>
                    <th>Billing amount</th>
                    <th>Current Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>
                        <div className="renter-cell">
                          <strong>{req.farmer_name}</strong>
                          <span className="renter-email">{req.farmer_email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="eq-cell">
                          <strong>{req.equipment_name}</strong>
                          <span className="eq-cat">{req.equipment_category}</span>
                        </div>
                      </td>
                      <td>
                        <div className="dates-col">
                          <span><strong>From:</strong> {req.start_date}</span>
                          <span><strong>To:</strong> {req.end_date}</span>
                        </div>
                      </td>
                      <td><strong className="bill-cost">${parseFloat(req.total_cost).toFixed(2)}</strong></td>
                      <td>
                        <span className={`badge badge-${req.status}`}>
                          {req.status === 'pending' ? 'Pending Approval' : req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' ? (
                          <div className="approval-actions-group">
                            <button 
                              className="btn btn-primary btn-sm approve-btn"
                              onClick={() => handleProcessRequest(req.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-danger btn-sm reject-btn"
                              onClick={() => handleProcessRequest(req.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        ) : req.status === 'approved' ? (
                          <button 
                            className="btn btn-secondary btn-sm complete-btn"
                            onClick={() => handleProcessRequest(req.id, 'completed')}
                          >
                            Mark Completed
                          </button>
                        ) : (
                          <span className="no-actions">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
