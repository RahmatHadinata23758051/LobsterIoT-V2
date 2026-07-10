import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../../api/api';

export const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Email dan password wajib diisi.'); return; }
    if (!isPasswordValid) { setErrorMsg('Kata sandi tidak memenuhi standar keamanan.'); return; }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await api.login(email, password);
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        localStorage.setItem('lobsense_token', result.data.token);
        localStorage.setItem('lobsense_user', JSON.stringify(result.data.user));
        onLoginSuccess(result.data.token, result.data.user);
      } else {
        setErrorMsg(result.message || 'Email atau password salah.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const rules = [
    { met: hasMinLength, text: 'Min. 8 karakter' },
    { met: hasUppercase, text: 'Huruf besar' },
    { met: hasLowercase, text: 'Huruf kecil' },
    { met: hasNumber, text: 'Angka' },
  ];

  const serif = { fontFamily: "'DM Serif Display', Georgia, serif" };

  return (
    <div className="min-h-screen w-full flex font-[Poppins,sans-serif]">

      {/* ──────────────── LEFT — Editorial Visual Panel ──────────────── */}
      <div className="hidden lg:block lg:w-[58%] relative overflow-hidden bg-slate-950">
        {/* Photo */}
        <img
          src="/lobster_aquaculture.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          style={{ objectPosition: '50% 40%' }}
        />
        {/* Gradient: let photo breathe at top, dark at bottom for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Content — vertically spaced: brand top, text bottom */}
        <div className="relative z-10 h-full flex flex-col justify-between p-12 xl:p-16">
          {/* Top — brand wordmark */}
          <p className="text-white/50 text-[10px] font-semibold tracking-[0.35em] uppercase select-none">
            Lobsense
          </p>

          {/* Bottom — editorial headline */}
          <div className="max-w-lg space-y-5 pb-4">
            <h1
              style={serif}
              className="text-white text-[2.6rem] xl:text-5xl leading-[1.12] tracking-tight select-none"
            >
              Teknologi untuk<br />
              <em className="text-emerald-400 not-italic">akuakultur</em> yang<br />
              berkelanjutan.
            </h1>
            <p className="text-white/40 text-[12.5px] leading-relaxed max-w-[360px] font-light">
              Pemantauan real-time keramba jaring apung lobster air tawar —
              telemetri sensor, pengawasan video terpadu, peringatan otomatis.
            </p>
            <div className="flex items-center gap-3 pt-3">
              <span className="h-px w-6 bg-emerald-500/50" />
              <span className="text-white/25 text-[9px] font-medium tracking-[0.25em] uppercase">
                Sistem Layanan Akuakultur Monitoring
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── RIGHT — Login Form ──────────────── */}
      <div className="w-full lg:w-[42%] bg-[#fafaf9] flex items-center justify-center px-8 md:px-16 lg:px-20 relative min-h-screen">

        {/* Mobile-only brand header (when left panel is hidden) */}
        <div className="absolute top-8 left-8 lg:hidden">
          <p className="text-slate-400 text-[10px] font-semibold tracking-[0.3em] uppercase">Lobsense</p>
        </div>

        <div className="w-full max-w-[340px]">

          {/* ── Heading ── */}
          <div className="mb-10">
            <p className="text-[10px] font-semibold tracking-[0.35em] uppercase text-slate-400 mb-3">
              Lobsense V2
            </p>
            <h2
              style={serif}
              className="text-[28px] text-slate-900 tracking-tight leading-tight"
            >
              Masuk ke Platform
            </h2>
            <p className="text-slate-400 text-[12.5px] mt-2.5 font-light leading-relaxed">
              Masukkan kredensial operator Anda untuk mengakses panel kontrol.
            </p>
          </div>

          {/* ── Error ── */}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-2.5 bg-red-50/80 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
              <span className="text-[11.5px] font-medium text-red-700 leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-7">

            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 tracking-wide block mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="nama@lobsense.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-b border-slate-200 pb-2.5 text-[14px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-800 transition-colors duration-300 font-medium"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 tracking-wide block mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (!passwordTouched) setPasswordTouched(true); }}
                  required
                  className="w-full bg-transparent border-b border-slate-200 pb-2.5 pr-8 text-[14px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-800 transition-colors duration-300 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-2 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
                </button>
              </div>
            </div>

            {/* Password strength — subtle inline dots */}
            {passwordTouched && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 -mt-2">
                {rules.map(({ met, text }) => (
                  <span
                    key={text}
                    className={`text-[10px] font-semibold tracking-wide flex items-center gap-1.5 transition-colors duration-200
                      ${met ? 'text-emerald-600' : 'text-slate-300'}`}
                  >
                    <span className={`inline-block h-[5px] w-[5px] rounded-full transition-colors duration-200
                      ${met ? 'bg-emerald-500' : 'bg-slate-250'}`}
                    />
                    {text}
                  </span>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-150 disabled:text-slate-400 text-white text-[11.5px] font-semibold tracking-[0.12em] uppercase rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-not-allowed select-none"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* ── Footer ── */}
          <p className="text-[9px] text-slate-300 tracking-[0.2em] uppercase mt-14 text-center font-medium select-none">
            © 2026 Lobsense Monitoring
          </p>
        </div>
      </div>
    </div>
  );
};
