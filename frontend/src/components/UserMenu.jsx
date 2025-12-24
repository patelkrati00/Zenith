import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../AuthContext";

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ✅ FIX: derive display name correctly
  const displayName = user?.username || user?.email?.split("@")[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '👤', label: 'My Profile', path: '/profile' },
    { icon: '🏆', label: 'Achievements', path: '/achievements' },
    { icon: '📜', label: 'Certificates', path: '/certificates' },
    { icon: '🎟️', label: 'Redeem Code', path: '/redeem' },
  ];

  const bottomItems = [
    { icon: '📖', label: 'Docs', path: '/docs' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="user-menu-container" ref={dropdownRef}>
      <button
        className="profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className="profile-circle">
          {getInitial(displayName)}
        </div>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {/* User Info Section */}
          <div className="user-info-section">
            <div className="profile-circle-large">
              {getInitial(displayName)}
            </div>
            <div className="user-details">
              <h3 className="user-name">{displayName || 'User'}</h3>
              <p className="user-email">{user?.email || 'email@example.com'}</p>
            </div>
          </div>

          <div className="menu-divider"></div>

          {/* Main Menu Items */}
          <div className="menu-items">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="menu-item"
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </button>
            ))}

            {/* Theme Toggle */}
            <button
              className="menu-item"
              onClick={toggleTheme}
            >
              <span className="menu-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="menu-label">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
          </div>

          <div className="menu-divider"></div>

          {/* Bottom Menu Items */}
          <div className="menu-items">
            {bottomItems.map((item, index) => (
              <button
                key={index}
                className="menu-item"
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="menu-divider"></div>

          {/* Logout Button */}
          <div className="menu-items">
            <button
              className="menu-item logout-item"
              onClick={handleLogout}
            >
              <span className="menu-icon">🚪</span>
              <span className="menu-label">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
