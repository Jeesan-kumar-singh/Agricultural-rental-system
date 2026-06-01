import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EquipmentCard } from '../components/EquipmentCard';
import './Home.css';

export const Home = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Catalog filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    fetchCatalog();
  }, [category, maxPrice]); // Refetch when category/price updates directly

  const fetchCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      // Only fetch items currently listed as active/available for rentals
      const data = await api.equipment.getAll({
        search,
        category,
        max_price: maxPrice,
        available: true
      });
      setEquipmentList(data);
    } catch (err) {
      setError('Could not retrieve catalog. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setMaxPrice('');
    // Trigger catalog fetch directly with empty filters
    api.equipment.getAll({ available: true })
      .then(setEquipmentList)
      .catch(() => setError('Failed to reset catalog.'));
  };

  return (
    <div className="home-container">
      {/* Hero Banner Section */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1>Modern Agricultural Equipment, <span className="highlight">Rented Locally</span></h1>
          <p>Get high-grade tractors, harvesters, and tools directly from local owners. Save capital overheads and optimize production.</p>
        </div>
      </section>

      {/* Catalog & Filtering Section */}
      <section className="catalog-section" id="catalog">
        <div className="catalog-header-bar">
          <h2>Browse Available Inventory</h2>
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>Clear Filters</button>
        </div>

        {/* Filters control form */}
        <form onSubmit={handleSearchSubmit} className="filters-form card">
          <div className="filter-input-group search-input">
            <label className="form-label" htmlFor="search-bar">Search Listings</label>
            <div className="search-field-wrapper">
              <input
                id="search-bar"
                type="text"
                className="form-control"
                placeholder="e.g. John Deere, Harvester, Plow..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary search-action-btn">Search</button>
            </div>
          </div>

          <div className="filter-input-group">
            <label className="form-label" htmlFor="category-select">Category</label>
            <select
              id="category-select"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Tractors">Tractors</option>
              <option value="Harvesters">Harvesters</option>
              <option value="Plows & Tillage">Plows & Tillage</option>
              <option value="Planting & Seeding">Planting & Seeding</option>
              <option value="Other tools">Other tools</option>
            </select>
          </div>

          <div className="filter-input-group">
            <label className="form-label" htmlFor="price-filter">Max Daily Rate ($)</label>
            <input
              id="price-filter"
              type="number"
              min="0"
              className="form-control"
              placeholder="e.g. 250"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </form>

        {/* Results grid rendering */}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {equipmentList.length === 0 ? (
              <div className="empty-state-box card">
                <span className="empty-emoji">🌾</span>
                <h3>No equipment found</h3>
                <p>Try refining your search queries or category filters to explore more machinery listings.</p>
                <button className="btn btn-primary btn-sm" onClick={handleResetFilters}>View All Listings</button>
              </div>
            ) : (
              <div className="equipment-grid grid grid-cols-3">
                {equipmentList.map(item => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
