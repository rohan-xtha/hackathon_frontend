import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { ChevronLeft, QrCode as QrCodeIcon, Download, Share2, Info } from 'lucide-react';
import QRCode from 'react-qr-code';
import '../styles/global.css';

function DigitalPass() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found.');
        }

        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError(err.response?.data?.message || 'Failed to fetch user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/generate-qr`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      setError(err.response?.data?.message || 'Failed to generate QR code.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link to="/profile" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-600" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">My Digital Pass</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-8">
        {/* Pass Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-blue-600 px-6 py-8 text-white text-center">
            <h2 className="text-2xl font-extrabold tracking-tight">PARKING PASS</h2>
            <p className="text-blue-100 text-sm mt-1 opacity-90 uppercase tracking-widest">BugSlayer Ecosystem</p>
          </div>

          <div className="p-8 flex flex-col items-center">
            {user?.qrCode ? (
              <>
                <div className="bg-white p-4 rounded-2xl border-4 border-slate-50 shadow-inner mb-6">
                  <QRCode 
                    value={JSON.stringify({ userId: user._id, qrCode: user.qrCode })} 
                    size={200}
                    level="H"
                  />
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-lg font-bold text-slate-800 capitalize">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-slate-500 text-sm">@{user.username}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold transition-colors text-sm">
                    <Download size={18} /> Save Image
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold transition-colors text-sm">
                    <Share2 size={18} /> Share Pass
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <QrCodeIcon size={48} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Generate Your Pass</h3>
                <p className="text-slate-500 text-sm mb-8 max-w-[240px] mx-auto">
                  Create your permanent digital pass for automated entry and exit at all BugSlayer parking zones.
                </p>
                <button 
                  onClick={handleGenerateQR}
                  disabled={loading}
                  className="w-full py-4 px-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Generating...' : 'Create My Pass Now'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 px-6 py-4 flex items-center gap-3 border-t border-slate-100">
            <Info size={18} className="text-blue-500 shrink-0" />
            <p className="text-[11px] text-slate-500 leading-tight">
              This pass is permanent and unique to your account. Do not share your QR code with others for security reasons.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 space-y-4">
          <h4 className="font-bold text-slate-700 ml-1">How to use</h4>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold shrink-0">1</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Show this QR code to the guard at any BugSlayer parking entry.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold shrink-0">2</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              The guard will scan it to automatically log your entry time.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold shrink-0">3</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Repeat at the exit to automatically calculate fees and complete your session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DigitalPass;
