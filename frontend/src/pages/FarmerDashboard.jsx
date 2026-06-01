import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './FarmerDashboard.css';

export const FarmerDashboard = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.bookings.getMyBookings();
      setRentals(data);
    } catch (err) {
      setError('Failed to fetch rental history. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.bookings.updateStatus(bookingId, 'cancelled');
      // Update local state directly to show cancelled badge
      setRentals(prevRentals => 
        prevRentals.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
      );
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper status badge generator
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Approved</span>;
      case 'pending':
        return <span className="badge badge-pending">Pending Approval</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      case 'completed':
        return <span className="badge badge-info">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
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
    <div className="dashboard-container">
      <div className="dashboard-header card">
        <div className="dashboard-header-text">
          <h1>My Farmer Dashboard</h1>
          <p>Track your equipment bookings, active machinery rentals, and billing details.</p>
        </div>
        <div className="dashboard-stat-bubble">
          <span className="stat-label">Active Bookings</span>
          <span className="stat-value">{rentals.filter(r => r.status === 'approved' || r.status === 'pending').length}</span>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="rentals-list-section">
        <h2>My Rental History</h2>
        
        {rentals.length === 0 ? (
          <div className="empty-state card">
            <span className="empty-emoji">🚜</span>
            <h3>No bookings yet</h3>
            <p>You haven't requested any agricultural equipment bookings yet.</p>
            <a href="/" className="btn btn-primary btn-sm mt-2">Explore Equipment Catalog</a>
          </div>
        ) : (
          <div className="rentals-table-wrapper card">
            <table className="rentals-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Rental Period</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map(rental => (
                  <tr key={rental.id}>
                    <td>
                      <div className="table-equipment-cell">
                        <span className="table-eq-emoji">
                          {rental.equipment_category.toLowerCase().includes('tractor') ? '🚜' : '🌾'}
                        </span>
                        <div>
                          <strong>{rental.equipment_name}</strong>
                          <span className="table-owner-name">Owner: {rental.owner_name}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="table-category-tag">{rental.equipment_category}</span></td>
                    <td>
                      <div className="table-date-cell">
                        <span><strong>From:</strong> {rental.start_date}</span>
                        <span><strong>To:</strong> {rental.end_date}</span>
                      </div>
                    </td>
                    <td><strong className="table-cost-text">${parseFloat(rental.total_cost).toFixed(2)}</strong></td>
                    <td>{renderStatusBadge(rental.status)}</td>
                    <td>
                      {(rental.status === 'pending' || rental.status === 'approved') ? (
                        <button
                          className="btn btn-danger btn-sm cancel-action-btn"
                          onClick={() => handleCancelBooking(rental.id)}
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="no-action-label">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
