import React from 'react';
import { Link } from 'react-router-dom';
import './EquipmentCard.css';

// Earthy category emoji mapper
const getCategoryIcon = (category) => {
  const cat = category.toLowerCase();
  if (cat.includes('tractor')) return '🚜';
  if (cat.includes('harvest') || cat.includes('combine')) return '🌾';
  if (cat.includes('plow') || cat.includes('tillage')) return '🟫';
  if (cat.includes('seed') || cat.includes('planter')) return '🌱';
  return '🛠️';
};

// Generates an inline beautiful SVG background based on equipment name to avoid empty images
const getFallbackSvg = (name, category) => {
  const icon = getCategoryIcon(category);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" className="card-fallback-svg">
      <defs>
        <linearGradient id="farmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8f5e9" />
          <stop offset="100%" stopColor="#c8e6c9" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#farmGrad)" />
      
      {/* Abstract hills */}
      <path d="M-50,250 C100,180 200,230 450,160 L450,250 Z" fill="#a1c9a4" opacity="0.6"/>
      <path d="M-50,250 C150,150 250,200 450,120 L450,250 Z" fill="#81c784" opacity="0.4"/>
      
      <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" fontSize="96">{icon}</text>
      <text x="50%" y="75%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#2e7d32" fontWeight="700" fontFamily="Outfit">{category}</text>
    </svg>
  );
};

export const EquipmentCard = ({ item }) => {
  const { id, name, category, daily_rate, availability_status, owner_name, image_url } = item;

  return (
    <article className="equipment-card card">
      <div className="card-image-section">
        {image_url ? (
          <img src={image_url} alt={name} className="card-image" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          getFallbackSvg(name, category)
        )}
        <span className={`status-badge ${availability_status ? 'available' : 'booked'}`}>
          {availability_status ? 'Available' : 'Rented'}
        </span>
      </div>

      <div className="card-body">
        <span className="card-category">
          <span className="category-emoji">{getCategoryIcon(category)}</span> {category}
        </span>
        <h3 className="card-title">{name}</h3>
        <p className="card-owner">Listed by: <strong>{owner_name || 'Owner'}</strong></p>
        
        <div className="card-footer-section">
          <div className="price-tag">
            <span className="price-amount">${parseFloat(daily_rate).toFixed(2)}</span>
            <span className="price-label">/ day</span>
          </div>
          
          <Link to={`/equipment/${id}`} className="btn btn-primary btn-sm card-action-btn">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
};
