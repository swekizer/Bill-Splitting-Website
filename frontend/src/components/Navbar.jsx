import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, Plus, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#E9E7E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#202522] flex items-center justify-center text-white transition-transform group-hover:scale-95">
              <Receipt className="w-4 h-4 text-[#D97745]" strokeWidth={2.5} />
            </div>
            <span className="text-base font-semibold tracking-tight text-[#202522]">
              BillSplit
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-[#F7F6F2] text-[#202522] border border-[#E9E7E1]'
                      : 'text-[#5E6460] hover:text-[#202522] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bills</span>
                </Link>

                <Link
                  to="/upload"
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#D97745] hover:bg-[#C66534] text-white transition-all shadow-xs active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New Bill</span>
                </Link>

                <div className="h-4 w-px bg-[#E9E7E1] mx-1" />

                {/* User Info */}
                <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-[#FAF9F5] border border-[#E9E7E1]">
                  <div className="w-5 h-5 rounded-md bg-[#E9E7E1] text-[#202522] flex items-center justify-center text-[10px] font-semibold">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-medium text-[#202522] hidden md:inline max-w-[120px] truncate">
                    {user?.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-[#8C928D] hover:text-[#C53030] hover:bg-[#FDF2F2] rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-[#5E6460] hover:text-[#202522] transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-medium bg-[#202522] hover:bg-[#343B37] text-white rounded-lg transition-colors shadow-xs"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
