import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { billAPI } from '../services/api';
import { Upload, ArrowLeft, Image as ImageIcon, X, AlertCircle, FileText, Check } from 'lucide-react';

const UploadBill = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const stages = [
    { title: 'Uploading image', desc: 'Securely uploading to Cloudinary storage' },
    { title: 'Analyzing receipt', desc: 'Gemini AI extracting line items, subtotals, and taxes' },
    { title: 'Finalizing session', desc: 'Setting up live real-time splitting room' },
  ];

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Please upload a valid image format (JPEG, PNG, WEBP).');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError('');
      if (!title) {
        const defaultTitle = selected.name.split('.')[0].replace(/[-_]/g, ' ');
        setTitle(defaultTitle.charAt(0).toUpperCase() + defaultTitle.slice(1));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith('image/')) {
        setError('Please drop an image file.');
        return;
      }
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError('');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please provide a receipt image.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for this bill session.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProcessingStage(0);

    const timer1 = setTimeout(() => setProcessingStage(1), 1800);
    const timer2 = setTimeout(() => setProcessingStage(2), 4800);

    try {
      const res = await billAPI.uploadBill(file, title.trim());
      navigate(`/bill/${res.data.id}`);
    } catch (err) {
      console.error(err);
      clearTimeout(timer1);
      clearTimeout(timer2);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to parse receipt. Please verify image clarity and try again.';
      setError(msg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#5E6460] hover:text-[#202522] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bills</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-[#FFFFFF] border border-[#E9E7E1] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#202522] tracking-tight">
            Itemize Receipt with AI
          </h1>
          <p className="text-xs text-[#5E6460] mt-1 leading-relaxed">
            Upload any dining, grocery, or shared receipt. Gemini AI will identify line items, prices, and tax rates with high fidelity.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FDF2F2] border border-[#F7C8C8] text-[#C53030] rounded-lg flex items-start space-x-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#202522] mb-1.5">
              Bill Title / Purpose
            </label>
            <input
              type="text"
              required
              disabled={isProcessing}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lunch at Blue Tokai, Weekly Grocery Run"
              className="w-full bg-[#FFFFFF] border border-[#E9E7E1] hover:border-[#DCD9D1] rounded-lg px-3.5 py-2 text-xs text-[#202522] placeholder:text-[#8C928D] focus:outline-none focus:border-[#D97745] focus:ring-1 focus:ring-[#D97745] transition-colors disabled:opacity-50"
            />
          </div>

          {/* Receipt Upload Dropzone */}
          <div>
            <label className="block text-xs font-medium text-[#202522] mb-1.5">
              Receipt Image
            </label>

            {!preview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className="border border-dashed border-[#E9E7E1] hover:border-[#D97745] rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#FAF9F5] hover:bg-[#FDF3EE]/40 group"
              >
                <div className="w-10 h-10 mx-auto rounded-lg bg-[#FFFFFF] border border-[#E9E7E1] flex items-center justify-center text-[#5E6460] group-hover:text-[#D97745] group-hover:border-[#D97745] mb-3 transition-colors shadow-xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-[#202522]">
                  Click to browse or drag and drop image
                </div>
                <div className="text-[11px] text-[#8C928D] mt-1">
                  JPG, PNG, or WEBP receipts up to 10MB
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-[#E9E7E1] rounded-xl p-3.5 bg-[#FAF9F5] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#D97745] shrink-0" />
                    <span className="text-xs font-medium text-[#202522] truncate max-w-xs">
                      {file?.name}
                    </span>
                    <span className="text-[11px] text-[#8C928D]">
                      ({(file?.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={clearFile}
                      className="p-1 text-[#8C928D] hover:text-[#C53030] rounded-md transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-64 rounded-lg overflow-hidden border border-[#E9E7E1] bg-[#FFFFFF] flex items-center justify-center p-2">
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="max-h-60 w-auto object-contain rounded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stepper / Processing State */}
          {isProcessing ? (
            <div className="border border-[#E9E7E1] rounded-xl p-4 bg-[#FAF9F5] space-y-3">
              <div className="text-xs font-semibold text-[#202522] flex items-center justify-between">
                <span>Processing Pipeline</span>
                <span className="text-[11px] font-mono text-[#D97745]">
                  Step {processingStage + 1} of {stages.length}
                </span>
              </div>

              <div className="space-y-2">
                {stages.map((stage, idx) => {
                  const isCurrent = idx === processingStage;
                  const isDone = idx < processingStage;
                  return (
                    <div
                      key={stage.title}
                      className={`flex items-start space-x-2.5 p-2 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? 'bg-[#FFFFFF] border border-[#E9E7E1] text-[#202522]'
                          : isDone
                          ? 'text-[#1E6B3A]'
                          : 'text-[#8C928D]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <Check className="w-3.5 h-3.5 text-[#1E6B3A]" />
                        ) : isCurrent ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#D97745]/30 border-t-[#D97745] rounded-full animate-spin" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-[#DCD9D1]" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{stage.title}</div>
                        <div className="text-[11px] text-[#5E6460] mt-0.5">{stage.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!file}
              className="w-full py-2.5 px-4 bg-[#D97745] hover:bg-[#C66534] disabled:opacity-40 text-white text-xs font-medium rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Parse Receipt & Open Room</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadBill;
