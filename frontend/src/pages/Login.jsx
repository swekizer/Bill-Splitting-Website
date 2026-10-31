import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid email or password.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#202522] text-white mb-3 shadow-xs">
            <Receipt className="w-5 h-5 text-[#D97745]" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-semibold text-[#202522] tracking-tight">
            Sign in to BillSplit
          </h1>
          <p className="text-xs text-[#5E6460] mt-1">
            Collaborative expense itemization & settlement
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-6 sm:p-7 shadow-xs">
          {error && (
            <div className="mb-5 p-3 bg-[#FDF2F2] border border-[#F7C8C8] rounded-lg flex items-start space-x-2.5 text-[#C53030] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#202522] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C928D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full bg-[#FFFFFF] border border-[#E9E7E1] hover:border-[#DCD9D1] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#202522] placeholder:text-[#8C928D] focus:outline-none focus:border-[#D97745] focus:ring-1 focus:ring-[#D97745] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#202522]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C928D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FFFFFF] border border-[#E9E7E1] hover:border-[#DCD9D1] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#202522] placeholder:text-[#8C928D] focus:outline-none focus:border-[#D97745] focus:ring-1 focus:ring-[#D97745] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-[#202522] hover:bg-[#343B37] disabled:opacity-50 text-white text-xs font-medium rounded-lg shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#5E6460] mt-6">
          New to BillSplit?{' '}
          <Link to="/register" className="text-[#D97745] hover:text-[#C66534] font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
