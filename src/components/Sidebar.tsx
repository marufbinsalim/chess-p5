import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Game Menu</h3>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a href="#" className="sidebar-link">
              <span className="sidebar-icon">📊</span>
              <span className="sidebar-text">Stats</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a href="#" className="sidebar-link">
              <span className="sidebar-icon">⚙️</span>
              <span className="sidebar-text">Settings</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a href="#" className="sidebar-link">
              <span className="sidebar-icon">ℹ️</span>
              <span className="sidebar-text">Help</span>
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
