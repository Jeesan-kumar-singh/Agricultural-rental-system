import React from 'react';
import './Footer.css';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="logo-section">
            <span className="logo-icon">🚜</span>
            <span className="logo-text">Agri<span className="accent-text">Rent</span></span>
          </div>
          <p className="footer-tagline">
            Empowering local farmers by optimizing equipment utilization and reducing capital overheads.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-col">
            <h4 className="footer-heading">Services</h4>
            <ul className="footer-links">
              <li><a href="#catalog">Browse Catalog</a></li>
              <li><a href="#insurance">Rental Insurance</a></li>
              <li><a href="#support">Equipment Support</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#impact">Our Impact</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} AgriRent Inc. All rights reserved. Connecting farms, growing futures.</p>
      </div>
    </footer>
  );
};
