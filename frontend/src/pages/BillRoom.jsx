import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { billAPI, claimAPI } from '../services/api';
import { createWebSocketClient } from '../services/websocket';
import {
  Receipt,
  Users,
  Check,
  ArrowLeft,
  Trash2,
  Share2,
  Image as ImageIcon,
  AlertTriangle,
  X,
  Plus,
} from 'lucide-react';

const BillRoom = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReceiptImage, setShowReceiptImage] = useState(false);

  // Claim interaction state per item: { [itemId]: percentage }
  const [customPercentages, setCustomPercentages] = useState({});
  const [submittingItemId, setSubmittingItemId] = useState(null);

  // Delete Bill state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingBill, setIsDeletingBill] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const stompClientRef = useRef(null);

  useEffect(() => {
    loadBill();

    // Initialize STOMP WebSocket connection
    const client = createWebSocketClient({
      onConnect: () => {
        setWsConnected(true);

        // 1. Subscribe to new claim broadcasts
        client.subscribe(`/topic/bill/${id}`, (message) => {
          try {
            const newClaim = JSON.parse(message.body);
            handleIncomingClaim(newClaim);
          } catch (err) {
            console.error('Failed to parse STOMP claim payload:', err);
          }
        });

        // 2. Subscribe to unclaim broadcasts
        client.subscribe(`/topic/bill/${id}/unclaim`, (message) => {
          try {
            const unclaimId = JSON.parse(message.body);
            handleIncomingUnclaim(Number(unclaimId));
          } catch (err) {
            console.error('Failed to parse STOMP unclaim payload:', err);
          }
        });
      },
      onError: () => setWsConnected(false),
      onDisconnect: () => setWsConnected(false),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [id]);

  const loadBill = async () => {
    try {
      setLoading(true);
      const res = await billAPI.getBill(id);
      setBill(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load bill session.');
    } finally {
      setLoading(false);
    }
  };

  const handleIncomingClaim = (newClaim) => {
    setBill((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((item) => {
        if (item.id === newClaim.billItemId) {
          const existingIndex = item.claims.findIndex((c) => c.id === newClaim.id);
          let newClaimsList;
          if (existingIndex >= 0) {
            newClaimsList = [...item.claims];
            newClaimsList[existingIndex] = newClaim;
          } else {
            newClaimsList = [...item.claims, newClaim];
          }
          return { ...item, claims: newClaimsList };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleIncomingUnclaim = (claimId) => {
    setBill((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((item) => ({
        ...item,
        claims: item.claims.filter((c) => c.id !== claimId),
      }));
      return { ...prev, items: updatedItems };
    });
  };

  const handleClaim = async (itemId, percentage) => {
    if (percentage <= 0) return;
    try {
      setSubmittingItemId(itemId);
      await claimAPI.claimItem(itemId, percentage);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Could not claim item share.');
    } finally {
      setSubmittingItemId(null);
    }
  };

  const handleClaimSubmit = (item, remainingPercent) => {
    const rawVal = customPercentages[item.id];
    let percentToClaim;

    if (rawVal === undefined || rawVal === '' || rawVal === null) {
      // If claim pressed directly -> 100% (or remaining)
      percentToClaim = remainingPercent;
    } else {
      const parsed = parseFloat(rawVal);
      if (isNaN(parsed) || parsed <= 0) {
        percentToClaim = remainingPercent;
      } else {
        percentToClaim = Math.min(remainingPercent, parsed);
      }
    }

    handleClaim(item.id, percentToClaim);
    setCustomPercentages((prev) => ({ ...prev, [item.id]: '' }));
  };

  const handleUnclaim = async (claimId) => {
    try {
      await claimAPI.unclaimItem(claimId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Could not remove claim.');
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteBill = async () => {
    setIsDeletingBill(true);
    setDeleteError('');
    try {
      await billAPI.deleteBill(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete bill:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete bill.');
      setIsDeletingBill(false);
    }
  };

  const isHost = bill && user && (bill.hostUserEmail === user.email || bill.hostUserId === user.id);

  // Settlement calculations
  const settlementData = useMemo(() => {
    if (!bill || !bill.items) return { participants: [], totalClaimed: 0 };

    const participantMap = {};
    let totalItemsClaimedAmount = 0;

    bill.items.forEach((item) => {
      item.claims?.forEach((claim) => {
        const email = claim.userEmail || `user_${claim.userId}`;
        if (!participantMap[email]) {
          participantMap[email] = {
            userId: claim.userId,
            name: claim.userName || email,
            email: email,
            itemsAmount: 0,
            claimsCount: 0,
          };
        }
        const claimAmt = parseFloat(claim.amountDue) || 0;
        participantMap[email].itemsAmount += claimAmt;
        participantMap[email].claimsCount += 1;
        totalItemsClaimedAmount += claimAmt;
      });
    });

    const subTotal = parseFloat(bill.subTotal) || 1;
    const taxesTips = parseFloat(bill.taxesTips) || 0;

    const participants = Object.values(participantMap).map((p) => {
      const ratio = subTotal > 0 ? p.itemsAmount / subTotal : 0;
      const taxTipShare = ratio * taxesTips;
      const totalDue = p.itemsAmount + taxTipShare;

      return {
        ...p,
        taxTipShare,
        totalDue,
      };
    });

    participants.sort((a, b) => b.totalDue - a.totalDue);

    return {
      participants,
      totalClaimed: totalItemsClaimedAmount,
    };
  }, [bill]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#E9E7E1] border-t-[#D97745] rounded-full animate-spin" />
        <span className="text-xs text-[#8C928D]">Synchronizing bill data...</span>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#E9E7E1] text-[#8C928D] mx-auto flex items-center justify-center mb-3">
          <Receipt className="w-5 h-5" />
        </div>
        <h2 className="text-base font-semibold text-[#202522]">Bill session not found</h2>
        <p className="text-xs text-[#5E6460] mt-1 mb-5">
          {error || 'This bill session does not exist or has been removed.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#202522] text-white text-xs font-medium rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E9E7E1]">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 text-xs font-medium text-[#8C928D] uppercase tracking-wider mb-1">
            <Link to="/" className="hover:text-[#202522] transition-colors flex items-center space-x-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Bills</span>
            </Link>
            <span>/</span>
            <span className="text-[#5E6460]">Session #{bill.id}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#202522] tracking-tight truncate">
              {bill.title || `Bill #${bill.id}`}
            </h1>

            {/* Live Indicator */}
            <div
              className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                wsConnected
                  ? 'bg-[#EAF5EE] text-[#1E6B3A] border-[#C6E7D0]'
                  : 'bg-[#FAF9F5] text-[#8C928D] border-[#E9E7E1]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-[#1E6B3A]' : 'bg-[#8C928D]'}`} />
              <span>{wsConnected ? 'Live sync' : 'Offline'}</span>
            </div>
          </div>

          <div className="text-xs text-[#5E6460] mt-1">
            Hosted by <span className="font-medium text-[#202522]">{bill.hostUserName}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {bill.imageUrl && (
            <button
              onClick={() => setShowReceiptImage(!showReceiptImage)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#E9E7E1] hover:border-[#DCD9D1] text-xs font-medium text-[#202522] rounded-lg transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#5E6460]" />
              <span>{showReceiptImage ? 'Hide Receipt' : 'View Receipt'}</span>
            </button>
          )}

          <button
            onClick={copyRoomLink}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FAF9F5] border border-[#E9E7E1] hover:border-[#DCD9D1] text-xs font-medium text-[#202522] rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#1E6B3A]" /> : <Share2 className="w-3.5 h-3.5 text-[#5E6460]" />}
            <span>{copied ? 'Link Copied' : 'Share'}</span>
          </button>

          {/* Delete Bill (Host Only) */}
          {isHost && (
            <button
              onClick={() => setShowDeleteModal(true)}
              title="Delete this bill"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FDF2F2] border border-[#E9E7E1] hover:border-[#F7C8C8] text-xs font-medium text-[#C53030] rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Receipt Viewer Drawer */}
      {showReceiptImage && bill.imageUrl && (
        <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#5E6460]">
            <span>Original Uploaded Receipt</span>
            <button
              onClick={() => setShowReceiptImage(false)}
              className="text-[#8C928D] hover:text-[#202522] text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-[#E9E7E1] bg-[#FAF9F5] p-2 flex items-center justify-center">
            <img src={bill.imageUrl} alt="Receipt image" className="max-h-76 w-auto object-contain rounded" />
          </div>
        </div>
      )}

      {/* Financial Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-medium tracking-wider uppercase text-[#8C928D] mb-0.5">
            Subtotal
          </div>
          <div className="text-base sm:text-lg font-semibold text-[#202522] tabular-nums">
            ₹{parseFloat(bill.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-medium tracking-wider uppercase text-[#8C928D] mb-0.5">
            Taxes & Surcharges
          </div>
          <div className="text-base sm:text-lg font-semibold text-[#5E6460] tabular-nums">
            ₹{parseFloat(bill.taxesTips || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-medium tracking-wider uppercase text-[#8C928D] mb-0.5">
            Grand Total
          </div>
          <div className="text-base sm:text-lg font-semibold text-[#D97745] tabular-nums">
            ₹{parseFloat(bill.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-medium tracking-wider uppercase text-[#8C928D] mb-0.5">
            Allocated Sum
          </div>
          <div className="text-base sm:text-lg font-semibold text-[#202522] tabular-nums">
            ₹{settlementData.totalClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Line Items (8 of 12 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9E7E1]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#202522]">
                Line Items
              </span>
              <span className="text-[10px] font-medium bg-[#FAF9F5] border border-[#E9E7E1] px-1.5 py-0.2 rounded text-[#5E6460]">
                {bill.items?.length || 0}
              </span>
            </div>
            <span className="text-[11px] text-[#8C928D]">
              Click allocations below to claim
            </span>
          </div>

          <div className="space-y-3">
            {bill.items?.map((item) => {
              const claims = item.claims || [];
              const totalPercentClaimed = claims.reduce((acc, c) => acc + (c.percentageClaimed || 0), 0);
              const remainingPercent = Math.max(0, 100 - totalPercentClaimed);
              const isFullyClaimed = remainingPercent <= 0.01;

              const myClaim = claims.find((c) => c.userEmail === user?.email);

              // Palette for claimed bar portions
              const palette = ['#D97745', '#4A5568', '#718096', '#D69E2E', '#319795', '#805AD5'];

              return (
                <div
                  key={item.id}
                  className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-4 shadow-xs space-y-3 hover:border-[#DCD9D1] transition-colors"
                >
                  {/* Item Title and Price Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-semibold text-[#202522] truncate">
                          {item.productName}
                        </span>
                        {item.quantity > 1 && (
                          <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium bg-[#FAF9F5] border border-[#E9E7E1] text-[#5E6460] rounded">
                            ×{item.quantity}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8C928D] mt-0.5">
                        ₹{parseFloat(item.unitPrice).toFixed(2)} each
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#202522] tabular-nums">
                        ₹{parseFloat(item.totalPrice).toFixed(2)}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${
                          isFullyClaimed ? 'text-[#1E6B3A]' : 'text-[#D97745]'
                        }`}
                      >
                        {isFullyClaimed
                          ? '100% Allocated'
                          : `${remainingPercent.toFixed(0)}% available`}
                      </div>
                    </div>
                  </div>

                  {/* Allocation Segmented Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-[#F0EDE6] h-1.5 rounded-full overflow-hidden flex">
                      {claims.map((c, idx) => (
                        <div
                          key={c.id}
                          style={{
                            width: `${c.percentageClaimed}%`,
                            backgroundColor: palette[idx % palette.length],
                          }}
                          className="h-full transition-all duration-200"
                          title={`${c.userName}: ${c.percentageClaimed}%`}
                        />
                      ))}
                    </div>

                    {/* Claimer Chips */}
                    {claims.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {claims.map((c) => {
                          const isMe = c.userEmail === user?.email;
                          return (
                            <div
                              key={c.id}
                              className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                isMe
                                  ? 'bg-[#FDF3EE] border-[#F2C5B0] text-[#D97745]'
                                  : 'bg-[#FAF9F5] border-[#E9E7E1] text-[#5E6460]'
                              }`}
                            >
                              <span>
                                {isMe ? 'You' : c.userName} ({c.percentageClaimed}%)
                              </span>
                              <span className="font-semibold tabular-nums">
                                ₹{parseFloat(c.amountDue).toFixed(2)}
                              </span>
                              {isMe && (
                                <button
                                  onClick={() => handleUnclaim(c.id)}
                                  title="Remove claim"
                                  className="text-[#8C928D] hover:text-[#C53030] transition-colors ml-0.5 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Claim Controls: Percent Entry and Claim Button */}
                  {!isFullyClaimed && !myClaim && (
                    <div className="pt-2 border-t border-[#E9E7E1] flex items-center justify-end space-x-2">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="1"
                          max={remainingPercent}
                          placeholder={remainingPercent === 100 ? "100" : remainingPercent.toFixed(0)}
                          value={customPercentages[item.id] ?? ''}
                          onChange={(e) =>
                            setCustomPercentages({
                              ...customPercentages,
                              [item.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleClaimSubmit(item, remainingPercent);
                            }
                          }}
                          className="w-16 bg-[#FFFFFF] border border-[#E9E7E1] hover:border-[#DCD9D1] rounded-md px-2 py-1 text-xs text-right pr-6 text-[#202522] placeholder:text-[#8C928D] focus:outline-none focus:border-[#D97745] focus:ring-1 focus:ring-[#D97745] tabular-nums transition-colors"
                        />
                        <span className="absolute right-2 text-xs text-[#8C928D] pointer-events-none">%</span>
                      </div>

                      <button
                        onClick={() => handleClaimSubmit(item, remainingPercent)}
                        disabled={submittingItemId === item.id}
                        className="px-3.5 py-1 bg-[#D97745] hover:bg-[#C66534] disabled:opacity-50 text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center justify-center cursor-pointer min-w-[60px]"
                      >
                        {submittingItemId === item.id ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>Claim</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Participant Settlement (4 of 12 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-5 shadow-xs sticky top-20 space-y-4">
            <div className="pb-3 border-b border-[#E9E7E1] flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-[#202522] uppercase tracking-wider">
                  Settlement Summary
                </h2>
                <p className="text-[11px] text-[#5E6460] mt-0.5">
                  Proportional tax/tip distribution
                </p>
              </div>
              <Users className="w-4 h-4 text-[#8C928D]" />
            </div>

            {settlementData.participants.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8C928D]">
                No claimed items yet. Use the claim controls on the left to allocate line items.
              </div>
            ) : (
              <div className="space-y-3">
                {settlementData.participants.map((p) => {
                  const isMe = p.email === user?.email;
                  return (
                    <div
                      key={p.email}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                        isMe
                          ? 'bg-[#FDF3EE]/60 border-[#F2C5B0]'
                          : 'bg-[#FAF9F5] border-[#E9E7E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="w-5 h-5 rounded bg-[#E9E7E1] text-[#202522] flex items-center justify-center text-[10px] font-semibold shrink-0">
                            {p.name[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-semibold text-[#202522] truncate">
                            {p.name} {isMe && <span className="text-[10px] font-normal text-[#D97745]">(You)</span>}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8C928D]">
                          {p.claimsCount} {p.claimsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-[#E9E7E1]/80 text-[11px] text-[#5E6460]">
                        <div className="flex justify-between">
                          <span>Items share:</span>
                          <span className="text-[#202522] tabular-nums">
                            ₹{p.itemsAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes & Tips share:</span>
                          <span className="text-[#202522] tabular-nums">
                            + ₹{p.taxTipShare.toFixed(2)}
                          </span>
                        </div>
                        <div className="pt-1.5 mt-1 border-t border-[#E9E7E1] flex justify-between font-semibold text-xs text-[#202522]">
                          <span>Total Amount Due:</span>
                          <span className="text-[#D97745] tabular-nums font-bold">
                            ₹{p.totalDue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Final Reconciliation Box */}
                <div className="pt-3 border-t border-[#E9E7E1] space-y-1.5 text-xs text-[#5E6460]">
                  <div className="flex justify-between">
                    <span>Allocated Items:</span>
                    <span className="text-[#202522] tabular-nums">
                      ₹{settlementData.totalClaimed.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-[#202522] tabular-nums">
                      ₹{parseFloat(bill.subTotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E9E7E1] font-semibold text-xs text-[#202522]">
                    <span>Receipt Total:</span>
                    <span className="tabular-nums">
                      ₹{parseFloat(bill.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl max-w-md w-full p-6 shadow-md space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-[#FDF2F2] border border-[#F7C8C8] text-[#C53030] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
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
                Are you sure you want to delete this bill session? All claimed line items and settlements will be permanently erased.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#F7C8C8] text-[#C53030] rounded-lg text-xs">
                {deleteError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-[#E9E7E1]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingBill}
                className="px-3.5 py-1.5 text-xs font-medium text-[#5E6460] hover:text-[#202522] bg-[#FFFFFF] border border-[#E9E7E1] rounded-lg hover:bg-[#FAF9F5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBill}
                disabled={isDeletingBill}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#C53030] hover:bg-[#B02828] rounded-lg transition-colors flex items-center space-x-1.5"
              >
                {isDeletingBill ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Bill</span>
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

export default BillRoom;
