import React, { useState } from 'react';
import { Settings, Globe, CheckCircle, ShieldAlert, Info } from 'lucide-react';

export const SystemSettings = ({
  user,
  logoText,
  setLogoText,
  instansiName,
  setInstansiName,
  logActivity,
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [tempLogo, setTempLogo] = useState(logoText);
  const [tempInstansi, setTempInstansi] = useState(instansiName);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  const handleBrandingSubmit = (e) => {
    e.preventDefault();
    if (!tempLogo.trim() || !tempInstansi.trim()) return;
    localStorage.setItem('slam_logo_text', tempLogo.trim());
    localStorage.setItem('slam_instansi_name', tempInstansi.trim());
    setLogoText(tempLogo.trim());
    setInstansiName(tempInstansi.trim());
    if (logActivity) logActivity(`Mengubah branding sistem — Logo: "${tempLogo.trim()}", Instansi: "${tempInstansi.trim()}"`);
    setBrandingSuccess(true);
    setTimeout(() => setBrandingSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-[#22C55E] p-2 rounded-xl shadow-sm">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Konfigurasi branding dan identitas sistem — hanya dapat diubah oleh Administrator
          </p>
        </div>
      </div>

      {/* Admin Access Guard */}
      {!isAdmin ? (
        <div className="bg-white border border-amber-200 rounded-xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h2 className="text-[15px] font-extrabold text-slate-800 mb-1">Akses Terbatas</h2>
            <p className="text-[12px] text-slate-400 font-medium max-w-sm">
              Halaman ini hanya dapat diakses oleh pengguna dengan hak akses <span className="font-bold text-amber-600">Administrator</span>.
              Hubungi admin sistem untuk mengubah konfigurasi branding.
            </p>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[11px] text-amber-700 font-semibold">
              Role Anda saat ini: <span className="uppercase font-extrabold">{user?.role || '—'}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: Branding Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-[#22C55E]" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">Branding & Identitas</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  Ubah nama logo dan instansi yang tampil di seluruh aplikasi
                </p>
              </div>
            </div>

            <form onSubmit={handleBrandingSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Nama Logo / Singkatan Sistem
                </label>
                <input
                  type="text"
                  required
                  value={tempLogo}
                  onChange={(e) => setTempLogo(e.target.value)}
                  placeholder="Contoh: SLAM 2.0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-[14px] font-bold focus:outline-none focus:border-[#22C55E] focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Ditampilkan di sidebar kiri atas dan tab browser
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Nama Lengkap Instansi
                </label>
                <input
                  type="text"
                  required
                  value={tempInstansi}
                  onChange={(e) => setTempInstansi(e.target.value)}
                  placeholder="Contoh: Balai Akuakultur Nusantara"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-[13px] focus:outline-none focus:border-[#22C55E] focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Ditampilkan di footer bawah setiap halaman
                </p>
              </div>

              {brandingSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[11px] font-bold">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  Konfigurasi branding sistem berhasil diperbarui secara instan!
                </div>
              )}

              {/* Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pratinjau</p>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-[#22C55E] p-1 rounded-md">
                    <img src="/Icon.png" alt="Logo" className="h-4 w-4 rounded-sm object-cover" />
                  </div>
                  <span className="text-[13px] font-black text-slate-900">{tempLogo || 'SLAM 2.0'}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Footer: <span className="font-semibold text-slate-600">
                    {tempLogo || 'SLAM 2.0'} © 2026 · {tempInstansi || 'Balai Akuakultur Nusantara'}
                  </span>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-[12px] font-extrabold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/20"
              >
                Simpan Konfigurasi Branding
              </button>
            </form>
          </div>

          {/* Column 2: Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Settings className="h-4 w-4 text-[#22C55E]" />
              <h2 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wide">Konfigurasi Aktif</h2>
            </div>
            <div className="space-y-0 divide-y divide-slate-50 text-[12px]">
              {[
                { label: 'Nama Logo Aktif', value: logoText, bold: true },
                { label: 'Nama Instansi Aktif', value: instansiName },
                { label: 'Dikelola oleh', value: user?.name || '—', green: true },
                { label: 'Role', value: user?.role || '—', mono: true, green: true },
              ].map(({ label, value, bold, mono, green }) => (
                <div key={label} className="flex justify-between items-center py-2.5 gap-2">
                  <span className="text-slate-400 font-medium shrink-0">{label}</span>
                  <span className={`font-semibold text-right truncate max-w-[140px] ${green ? 'text-[#22C55E]' : 'text-slate-800'} ${bold ? 'font-extrabold' : ''} ${mono ? 'font-mono' : ''}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
