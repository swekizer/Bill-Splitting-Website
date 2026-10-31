import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { billAPI } from '../services/api';
import {
  Receipt,
  Plus,
  ArrowRight,
  Calendar,
  Trash2,
  Search,
  Hash,
  AlertTriangle,
  X,
  UserCheck,
  User,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billIdInput, setBillIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'hosted' | 'participated'
  const [billToDelete, setBillToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await billAPI.getMyBills();
      setBills(res.data || []);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinById = (e) => {
    e.preventDefault();
    if (!billIdInput.trim()) return;
    const cleanId = billIdInput.trim().replace('#', '');
    navigate(`/bill/${cleanId}`);
  };

  const confirmDeleteBill = async () => {
    if (!billToDelete) return;
    setIsDeleting(true);
    setActionError('');
    try {
      await billAPI.deleteBill(billToDelete.id);
      setBills((prev) => prev.filter((b) => b.id !== billToDelete.id));
      setBillToDelete(null);
    } catch (err) {
      console.error('Failed to delete bill:', err);
      setActionError(err.response?.data?.message || 'Failed to delete bill.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hostedCount = bills.filter((b) => b.isHost).length;
  const participatedCount = bills.filter((b) => !b.isHost).length;

  const filteredBills = bills.filter((b) => {
    // Tab filter
    if (activeTab === 'hosted' && !b.isHost) return false;
    if (activeTab === 'participated' && b.isHost) return false;

    // Search query
    const term = searchQuery.toLowerCase();
    return (
      (b.title && b.title.toLowerCase().includes(term)) ||
      String(b.id).includes(term) ||
      (b.hostUserName && b.hostUserName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E9E7E1]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-medium text-[#8C928D] uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-[#5E6460]">Overview</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#202522] tracking-tight">
            Bills & Expenses
          </h1>
          <p className="text-xs text-[#5E6460] mt-1">
            Track bills you created and shared sessions you participated in.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Quick Join */}
          <form onSubmit={handleJoinById} className="flex">
            <div className="relative">
              <Hash className="w-3.5 h-3.5 text-[#8C928D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Join by ID..."
                value={billIdInput}
                onChange={(e) => setBillIdInput(e.target.value)}
                className="w-36 sm:w-40 bg-[#FFFFFF] border border-[#E9E7E1] rounded-l-lg pl-8 pr-2.5 py-1.5 text-xs text-[#202522] placeholder:text-[#8C928D] focus:outline-none focus:border-[#D97745] focus:ring-1 focus:ring-[#D97745] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#FAF9F5] hover:bg-[#F2EFE9] border-y border-r border-[#E9E7E1] text-xs font-medium text-[#202522] rounded-r-lg transition-colors cursor-pointer"
            >
              Open
            </button>
          </form>

          {/* Upload Button */}
          <Link
            to="/upload"
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-[#D97745] hover:bg-[#C66534] text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Receipt</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab('hosted')}
          className={`bg-[#FFFFFF] border rounded-xl p-4.5 shadow-xs cursor-pointer transition-colors ${
            activeTab === 'hosted' ? 'border-[#D97745]' : 'border-[#E9E7E1] hover:border-[#DCD9D1]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium tracking-wider uppercase text-[#8C928D]">
              Hosted by You
            </span>
            <User className="w-3.5 h-3.5 text-[#8C928D]" />
          </div>
          <div className="text-2xl font-semibold text-[#202522] tabular-nums">
            {hostedCount}
          </div>
          <div className="text-[11px] text-[#5E6460] mt-1">
            Bills you created and organized
          </div>
        </div>

        <div
          onClick={() => setActiveTab('participated')}
          className={`bg-[#FFFFFF] border rounded-xl p-4.5 shadow-xs cursor-pointer transition-colors ${
            activeTab === 'participated' ? 'border-[#D97745]' : 'border-[#E9E7E1] hover:border-[#DCD9D1]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium tracking-wider uppercase text-[#8C928D]">
              Shared with You
            </span>
            <UserCheck className="w-3.5 h-3.5 text-[#8C928D]" />
          </div>
          <div className="text-2xl font-semibold text-[#202522] tabular-nums">
            {participatedCount}
          </div>
          <div className="text-[11px] text-[#5E6460] mt-1">
            Sessions joined via share link or claiming
          </div>
        </div>
      </div>

      {/* Bills Section */}
      <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl shadow-xs overflow-hidden">
        {/* Table / List Header Controls */}
        <div className="px-5 py-3 border-b border-[#E9E7E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F5]">
          {/* Tab buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#FFFFFF] border border-[#E9E7E1] text-[#202522] shadow-xs'
                  : 'text-[#5E6460] hover:text-[#202522]'
              }`}
            >
              All Bills ({bills.length})
            </button>
            <button
              onClick={() => setActiveTab('hosted')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'hosted'
                  ? 'bg-[#FFFFFF] border border-[#E9E7E1] text-[#202522] shadow-xs'
                  : 'text-[#5E6460] hover:text-[#202522]'
              }`}
            >
              Hosted ({hostedCount})
            </button>
            <button
              onClick={() => setActiveTab('participated')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'participated'
                  ? 'bg-[#FFFFFF] border border-[#E9E7E1] text-[#202522] shadow-xs'
                  : 'text-[#5E6460] hover:text-[#202522]'
              }`}
            >
              Shared ({participatedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8C928D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, ID, or host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E9E7E1] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#202522] placeholder:text-[#8C928D] focus:outline-none focus:border-[#D97745] focus:ring-1 focus:ring-[#D97745] transition-colors"
            />
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2.5">
            <div className="w-5 h-5 border-2 border-[#E9E7E1] border-t-[#D97745] rounded-full animate-spin" />
            <span className="text-xs text-[#8C928D]">Fetching receipts...</span>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#E9E7E1] text-[#8C928D] mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-[#202522]">
              {searchQuery
                ? 'No matching bills found'
                : activeTab === 'participated'
                ? 'No shared bills yet'
                : 'No bills recorded yet'}
            </h3>
            <p className="text-xs text-[#5E6460] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search query or clear the filter.'
                : activeTab === 'participated'
                ? 'When friends share a bill link with you, it will appear here automatically.'
                : 'Upload your first dining, grocery, or shared receipt to get started.'}
            </p>
            {!searchQuery && activeTab !== 'participated' && (
              <Link
                to="/upload"
                className="inline-flex items-center space-x-1.5 mt-4 px-3.5 py-1.5 bg-[#202522] hover:bg-[#343B37] text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Receipt</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#E9E7E1]">
            {filteredBills.map((bill) => {
              const isHost = bill.isHost;
              const hasMyShare = bill.myShare !== undefined && parseFloat(bill.myShare) > 0;

              return (
                <div
                  key={bill.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F5] transition-colors group"
                >
                  {/* Bill Info */}
                  <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#FAF9F5] border border-[#E9E7E1] flex items-center justify-center text-[#202522] shrink-0 group-hover:border-[#DCD9D1] transition-colors">
                      <Receipt className="w-4 h-4 text-[#D97745]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/bill/${bill.id}`}
                          className="text-xs sm:text-sm font-semibold text-[#202522] hover:text-[#D97745] transition-colors truncate"
                        >
                          {bill.title || `Bill #${bill.id}`}
                        </Link>
                        <span className="text-[10px] font-mono text-[#8C928D]">
                          #{bill.id}
                        </span>

                        {/* Role tag */}
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-medium rounded border ${
                            isHost
                              ? 'bg-[#FAF9F5] border-[#E9E7E1] text-[#202522]'
                              : 'bg-[#FDF3EE] border-[#F2C5B0] text-[#D97745]'
                          }`}
                        >
                          {isHost ? 'Host' : 'Participant'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#5E6460] mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-[#8C928D]" />
                          <span>
                            {bill.createdAt
                              ? new Date(bill.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </span>
                        </span>
                        <span>•</span>
                        <span>
                          {isHost ? 'Created by you' : `Hosted by ${bill.hostUserName || 'Friend'}`}
                        </span>
                        {bill.participantCount > 1 && (
                          <>
                            <span>•</span>
                            <span>{bill.participantCount} participants</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 pl-12 sm:pl-0">
                    <div className="text-left sm:text-right">
                      {!isHost && hasMyShare ? (
                        <>
                          <div className="text-[11px] text-[#8C928D]">Your Share</div>
                          <div className="text-sm sm:text-base font-semibold text-[#D97745] tabular-nums">
                            ₹{parseFloat(bill.myShare).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-[#8C928D]">
                            of ₹{parseFloat(bill.total || 0).toFixed(2)} total
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[11px] text-[#8C928D]">Total Bill</div>
                          <div className="text-sm sm:text-base font-semibold text-[#202522] tabular-nums">
                            ₹{parseFloat(bill.total || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/bill/${bill.id}`}
                        className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#E9E7E1] hover:border-[#DCD9D1] text-xs font-medium text-[#202522] rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3 text-[#8C928D]" />
                      </Link>

                      {/* Delete Bill Trigger (ONLY FOR HOST) */}
                      {isHost && (
                        <button
                          onClick={() => setBillToDelete(bill)}
                          title="Delete bill"
                          className="p-1.5 text-[#8C928D] hover:text-[#C53030] hover:bg-[#FDF2F2] rounded-lg border border-transparent hover:border-[#F7C8C8] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl max-w-md w-full p-6 shadow-md space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-[#FDF2F2] border border-[#F7C8C8] text-[#C53030] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <button
                onClick={() => setBillToDelete(null)}
                className="p-1 text-[#8C928D] hover:text-[#202522] rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#202522]">
                Delete bill session?
              </h3>
              <p className="text-xs text-[#5E6460] mt-1.5 leading-relaxed">
                This will permanently remove{' '}
                <span className="font-semibold text-[#202522]">
                  "{billToDelete.title || `Bill #${billToDelete.id}`}"
                </span>{' '}
                along with all its line items and claimed shares. This action cannot be undone.
              </p>
            </div>

            {actionError && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#F7C8C8] text-[#C53030] rounded-lg text-xs">
                {actionError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-[#E9E7E1]">
              <button
                type="button"
                onClick={() => setBillToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-medium text-[#5E6460] hover:text-[#202522] bg-[#FFFFFF] border border-[#E9E7E1] rounded-lg hover:bg-[#FAF9F5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteBill}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#C53030] hover:bg-[#B02828] rounded-lg transition-colors flex items-center space-x-1.5"
              >
                {isDeleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
