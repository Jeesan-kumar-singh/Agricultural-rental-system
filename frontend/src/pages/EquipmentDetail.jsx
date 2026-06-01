import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './EquipmentDetail.css';

export const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isFarmer } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingDays, setBookingDays] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingSubmit, setBookingSubmit] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    calculateCost();
  }, [startDate, endDate]);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.equipment.getOne(id);
      setItem(data);
    } catch (err) {
      setError('Equipment details not found or listing has been removed.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    if (!startDate || !endDate || !item) {
      setBookingDays(0);
      setEstimatedCost(0);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setBookingDays(0);
      setEstimatedCost(0);
      return;
    }

    // Dynamic inclusive rental calculator
    const timeDiff = end.getTime() - start.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Inclusive day counting

    setBookingDays(dayDiff);
    setEstimatedCost(dayDiff * parseFloat(item.daily_rate));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      // Force user login while retaining details page route context
      navigate('/login', { state: { from: { pathname: `/equipment/${id}` } } });
      return;
    }

    if (!startDate || !endDate) {
      setBookingError('Please select both start and end rental dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setBookingError('Start date must be before or equal to the end date.');
      return;
    }

    setBookingSubmit(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      await api.bookings.create({
        equipment_id: id,
        start_date: startDate,
        end_date: endDate
      });
      
      setBookingSuccess('Your rental request was successfully sent to the equipment owner!');
      // Reset dates input
      setStartDate('');
      setEndDate('');
      
      setTimeout(() => {
        navigate('/farmer-dashboard');
      }, 3000);
    } catch (err) {
      setBookingError(err.message || 'Rental request could not be processed. Overlapping reservations found.');
    } finally {
      setBookingSubmit(false);
    }
  };

  // Get current date string (YYYY-MM-DD) to prevent renting in the past
  const getMinDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="alert alert-danger max-width-alert">
        <p>{error || 'An unexpected error occurred.'}</p>
        <Link to="/" className="btn btn-secondary btn-sm mt-3">Back to Catalog</Link>
      </div>
    );
  }

  const isOwnerOfItem = user && parseInt(item.owner_id) === parseInt(user.id);

  return (
    <div className="detail-container">
      <Link to="/" className="back-link">← Back to Catalog</Link>

      <div className="detail-grid">
        {/* Main specifications description column */}
        <div className="details-info-section card">
          <div className="details-image-wrapper">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="details-image" />
            ) : (
              <div className="details-fallback-image">
                <span className="details-fallback-emoji">🚜</span>
              </div>
            )}
          </div>

          <div className="details-body">
            <span className="details-category">{item.category}</span>
            <h1 className="details-title">{item.name}</h1>
            
            <div className="details-meta-row">
              <span className={`badge ${item.availability_status ? 'badge-success' : 'badge-danger'}`}>
                {item.availability_status ? 'Available for Rent' : 'Currently Rented'}
              </span>
              <span className="details-owner-text">Owner: <strong>{item.owner_name}</strong></span>
            </div>

            <div className="details-description">
              <h3>Description</h3>
              <p>{item.description || 'No detailed specifications or descriptions provided for this farm equipment listing.'}</p>
            </div>

            <div className="details-specifications">
              <h3>Technical Specs</h3>
              <ul className="spec-list">
                <li><strong>Power Source:</strong> Diesel Engine / Heavy duty traction</li>
                <li><strong>Operational Category:</strong> {item.category}</li>
                <li><strong>Owner Contacts:</strong> {item.owner_email || 'Verified Member'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Date Selector Booking panel column */}
        <div className="booking-panel-section">
          <div className="booking-sticky-card card">
            <div className="booking-price-header">
              <h2>${parseFloat(item.daily_rate).toFixed(2)} <span className="price-unit">/ day</span></h2>
            </div>

            <div className="booking-card-body">
              {bookingError && <div className="alert alert-danger">{bookingError}</div>}
              {bookingSuccess && <div className="alert alert-success">{bookingSuccess}</div>}

              {/* Show booking panel for farmers, or restrict for owners/admins */}
              {isOwnerOfItem ? (
                <div className="booking-notice warning">
                  <p><strong>Note:</strong> You listed this equipment. Use your dashboard controls to manage listings.</p>
                  <Link to="/admin-dashboard" className="btn btn-secondary full-width mt-3">Go to Dashboard</Link>
                </div>
              ) : isAuthenticated && !isFarmer ? (
                <div className="booking-notice info">
                  <p><strong>Renter account required:</strong> Equipment owners cannot rent equipment. Register a farmer account to request bookings.</p>
                </div>
              ) : !item.availability_status ? (
                <div className="booking-notice danger">
                  <p><strong>Currently Rented:</strong> This agricultural machinery is currently rented by another farmer and is unavailable for booking.</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="booking-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="start-date">Pickup Date</label>
                    <input
                      id="start-date"
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={getMinDate()}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="end-date">Return Date</label>
                    <input
                      id="end-date"
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || getMinDate()}
                      required
                    />
                  </div>

                  {bookingDays > 0 && (
                    <div className="pricing-summary-container">
                      <div className="summary-row">
                        <span>Daily Rental Rate</span>
                        <span>${parseFloat(item.daily_rate).toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Total Rental Period</span>
                        <span>{bookingDays} {bookingDays === 1 ? 'day' : 'days'}</span>
                      </div>
                      <hr className="summary-divider"/>
                      <div className="summary-row total">
                        <span>Estimated Total Cost</span>
                        <span className="total-amount">${estimatedCost.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-accent full-width booking-submit-btn" 
                    disabled={bookingSubmit || !item.availability_status}
                  >
                    {!isAuthenticated ? 'Login to Book Equipment' : bookingSubmit ? 'Booking...' : 'Request Rental'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
