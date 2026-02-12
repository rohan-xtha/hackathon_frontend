import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import API_URL from '../config';
import { QrCode, User, MapPin, Clock, Wallet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/global.css';

const GuardScanner = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    // Fetch parking lots for check-in selection
    const fetchLots = async () => {
      try {
        const response = await axios.get(`${API_URL}/parking/lots`);
        setParkingLots(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedLot(response.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch lots:', err);
      }
    };
    fetchLots();

    // Initialize scanner
    const qrScanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const fontSize = Math.floor(minEdge * 0.6);
        return {
          width: fontSize,
          height: fontSize
        };
      },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
    });

    qrScanner.render(onScanSuccess, onScanFailure);
    setScanner(qrScanner);

    return () => {
      qrScanner.clear();
    };
  }, []);

  async function onScanSuccess(decodedText) {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = JSON.parse(decodedText);
      
      if (!data.userId || !data.qrCode) {
        throw new Error("Invalid QR Pass format");
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/parking/guard-process`, {
        userId: data.userId,
        qrCode: data.qrCode,
        parkingLotId: selectedLot,
        vehicleType: 'car' // Default or add selector
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setScanResult(response.data);
      // Optional: Pause scanner for a few seconds
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.response?.data?.message || err.message || "Failed to process QR");
    } finally {
      setLoading(false);
    }
  }

  function onScanFailure(error) {
    // Silently handle scan failures (usually just "no QR found in frame")
  }

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <QrCode className="text-blue-600" /> Guard QR Scanner
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Scan user pass for entry/exit</p>
      </header>

      {!scanResult && !error && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
          <style>
            {`
              #reader {
                border: none !important;
                aspect-ratio: 1 / 1 !important;
                overflow: hidden !important;
                border-radius: 16px !important;
                background: #000 !important;
              }
              #reader video {
                object-fit: cover !important;
                aspect-ratio: 1 / 1 !important;
                width: 100% !important;
                height: 100% !important;
              }
              #reader__dashboard {
                padding: 10px !important;
              }
              #reader__camera_selection { 
                width: 100% !important;
                padding: 8px !important;
                border-radius: 8px !important;
                margin-bottom: 10px !important;
                border: 1px solid #e2e8f0 !important;
              }
              #reader button {
                background: #3b82f6 !important;
                color: white !important;
                border: none !important;
                padding: 8px 16px !important;
                border-radius: 8px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                margin: 5px !important;
              }
              #reader__status_span {
                display: none !important;
              }
              #reader__scan_region {
                background: #000 !important;
              }
            `}
          </style>
          <div className="lot-selector" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
              Your Parking Station
            </label>
            <select 
              value={selectedLot} 
              onChange={(e) => setSelectedLot(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', fontWeight: '600' }}
            >
              {parkingLots.map(lot => (
                <option key={lot._id} value={lot._id}>{lot.name}</option>
              ))}
            </select>
          </div>

          <div id="reader"></div>
          
          <div style={{ marginTop: '20px', padding: '15px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} className="text-blue-500" />
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
              Point the camera at the user's digital pass on their profile page.
            </p>
          </div>
        </div>
      )}

      {scanResult && (
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '24px', 
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          textAlign: 'center',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: scanResult.type === 'checkin' ? '#dcfce7' : '#dbeafe', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px' 
          }}>
            {scanResult.type === 'checkin' ? <CheckCircle2 size={40} className="text-green-600" /> : <Clock size={40} className="text-blue-600" />}
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
            {scanResult.type === 'checkin' ? 'Check-in Successful' : 'Check-out Successful'}
          </h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>{scanResult.message}</p>

          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <User size={18} className="text-slate-400" />
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Customer</span>
                <span style={{ fontWeight: '700', color: '#1e293b' }}>{scanResult.data.userName}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <MapPin size={18} className="text-slate-400" />
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Location</span>
                <span style={{ fontWeight: '700', color: '#1e293b' }}>{scanResult.data.lotName}</span>
              </div>
            </div>
            {scanResult.type === 'checkout' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Clock size={18} className="text-slate-400" />
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Duration</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{scanResult.data.duration}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Wallet size={18} className="text-slate-400" />
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Total Bill</span>
                    <span style={{ fontWeight: '800', color: '#2563eb', fontSize: '18px' }}>NPR {scanResult.data.amount}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={resetScanner}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              background: '#1e293b', 
              color: 'white', 
              fontWeight: '700', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            Scan Next User
          </button>
        </div>
      )}

      {error && (
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '24px', 
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          textAlign: 'center'
        }}>
          <XCircle size={60} className="text-red-500" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Scan Failed</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={resetScanner}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              background: '#ef4444', 
              color: 'white', 
              fontWeight: '700', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default GuardScanner;
