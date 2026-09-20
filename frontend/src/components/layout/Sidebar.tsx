import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import owlMascot from "../../assets/owl-mascot.png";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div>
        <div className="sidebar-logo">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={owlMascot}
              alt="Owl Mascot"
              style={{
                height: "42px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/history"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <History size={20} />
            <span>Attendance Logs</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{
            width: "100%",
            border: "none",
            background: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <LogOut size={20} color="var(--danger)" />
          <span style={{ color: "var(--danger)" }}>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
