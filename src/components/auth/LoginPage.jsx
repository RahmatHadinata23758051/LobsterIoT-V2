import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Check, X, Shield, Eye, EyeOff } from 'lucide-react';
import { api } from '../../api/api';

export const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password Validation Rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Kata sandi harus memenuhi standar keamanan (minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, dan angka).');
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

  const validationCriteria = [
    { label: 'Minimal 8 karakter', fulfilled: hasMinLength },
    { label: 'Mengandung huruf besar (A-Z)', fulfilled: hasUppercase },
    { label: 'Mengandung huruf kecil (a-z)', fulfilled: hasLowercase },
    { label: 'Mengandung angka (0-9)', fulfilled: hasNumber },
  ];

  return (
    <div className="min-h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* ═ PANEL KIRI (Asymmetric Visual Section with Pexels Image & Gradient) ═════ */}
      <div className="hidden lg:flex lg:w-7/12 relative bg-slate-950 overflow-hidden items-center justify-center">
        
        {/* Background Image of Freshwater Lobster Cage */}
        <img 
          src="/lobster_aquaculture.jpg" 
          alt="Freshwater Lobster Aquaculture" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 select-none"
        />

        {/* Deep, Rich Maskulin Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-[#051f08]/90 to-green-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/40" />

        {/* Floating Ambient Light Leak */}
        <div className="absolute -left-1/4 -bottom-1/4 w-96 h-96 bg-[#0D9D1B]/15 rounded-full blur-3xl" />
        <div className="absolute right-1/4 top-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

        {/* Overlay Editorial Text Chassis */}
        <div className="relative z-10 p-16 max-w-xl text-white space-y-6 flex flex-col justify-end h-full w-full select-none">
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-8 bg-[#0D9D1B] rounded-full" />
            <span className="text-[10px] font-bold text-[#0D9D1B] tracking-widest uppercase font-mono">Platform Lobsense V2</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight md:text-4xl text-slate-100">
              Freshwater Lobster <br/>
              <span className="text-[#0D9D1B]">Cage Monitoring</span> System
            </h1>
            <p className="text-[12px] text-slate-300 font-medium leading-relaxed font-sans max-w-sm">
              Menerapkan teknologi telemetri real-time, pengawasan video multi-node HLS, dan otomatisasi peringatan dini untuk kelangsungan ekosistem akuakultur lobster.
            </p>
          </div>
          <div className="pt-8 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
            <span>Balai Akuakultur Nusantara</span>
            <span>Est. 2026</span>
          </div>
        </div>

      </div>

      {/* ═ PANEL KANAN (Form Chassis - Ultra Clean, Minimal, and Precise) ═════ */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-8 md:p-16 select-none bg-white relative">
        
        {/* Abstract design elements */}
        <div className="absolute top-12 right-12 text-slate-200">
          <Shield className="h-20 w-20 stroke-[0.5]" />
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex bg-[#0D9D1B]/10 p-2 rounded-xl border border-[#0D9D1B]/20 text-[#0D9D1B] mb-2 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-[11px] text-slate-400 font-semibold">
              Masukkan kredensial operator Anda untuk mengakses panel kontrol pemantauan KJA.
            </p>
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <span className="leading-normal font-bold">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Email Operator
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="operator@lobsense.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-[12px] text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-[12px] text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Real-time Password Strength Checklist (appears on focus or when input starts) */}
            {(passwordFocused || password.length > 0) && (
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Standar Keamanan Kata Sandi
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10.5px]">
                  {validationCriteria.map(({ label, fulfilled }) => (
                    <div key={label} className="flex items-center gap-1.5 select-none">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 border transition-all duration-150
                        ${fulfilled 
                          ? 'bg-green-50 border-green-200 text-[#0D9D1B]' 
                          : 'bg-white border-slate-200 text-slate-300'}`}>
                        {fulfilled ? (
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        ) : (
                          <X className="h-2.5 w-2.5 stroke-[3]" />
                        )}
                      </div>
                      <span className={`font-semibold transition-colors duration-150 ${fulfilled ? 'text-green-700' : 'text-slate-450'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full py-3 bg-[#0D9D1B] hover:bg-[#0A8516] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none text-white text-[11px] font-bold rounded-xl tracking-wider uppercase transition-all duration-200 cursor-pointer disabled:cursor-not-allowed select-none shadow-md shadow-green-500/20"
            >
              {loading ? 'Mengotentikasi...' : 'Masuk Dashboard'}
            </button>

          </form>

          {/* Footer Details */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Lobsense Monitoring © 2026 · Hak Cipta Dilindungi
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
