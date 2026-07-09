import React, { useState } from 'react';
import { Waves, Lock, Mail, AlertCircle } from 'lucide-react';
import { api } from '../../api/api';

export const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await api.login(email, password);
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        const token = result.data.token;
        const user = result.data.user;
        
        // Save to localStorage
        localStorage.setItem('lobsense_token', token);
        localStorage.setItem('lobsense_user', JSON.stringify(user));
        
        onLoginSuccess(token, user);
      } else {
        setErrorMsg(result.message || 'Email atau password salah.');
      }
    } catch (err) {
      console.error('Login connection error:', err);
      setErrorMsg('Gagal terhubung ke server backend. Pastikan server backend Anda online.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col space-y-6">
        
        {/* Brand header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <div className="bg-[#22C55E] text-white p-3 rounded-2xl inline-flex shadow-sm shadow-green-500/20">
            <Waves className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SLAM 2.0</h2>
            <p className="text-xs text-slate-400 mt-1">Sistem Layanan Akuakultur Monitoring V2.0</p>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3.5 flex items-start space-x-2 text-xs">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <span className="leading-normal font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="operator@lobsense.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold rounded-lg tracking-wider uppercase transition cursor-pointer disabled:opacity-50 select-none shadow-sm shadow-green-500/10 text-xs"
          >
            {loading ? 'Masuk ke Sistem...' : 'Masuk Dashboard'}
          </button>
        </form>

      </div>
    </div>
  );
};
