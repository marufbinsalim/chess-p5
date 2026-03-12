import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">♔</span>
          <span className="logo-text">Chess Game</span>
        </div>
      </div>
      <div className="header-right">
        <div className="user-info">
          <div className="avatar"></div>
          <div className="username">Guest</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
