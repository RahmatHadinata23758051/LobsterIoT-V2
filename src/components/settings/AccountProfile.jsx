import React, { useState, useEffect } from 'react';
import { UserRound, Mail, Lock, CheckCircle, ShieldCheck, Info } from 'lucide-react';

export const AccountProfile = ({
  user,
  profileMessage,
  onUpdateProfile,
  logActivity,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localMsg, setLocalMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (profileMessage) setLocalMsg(profileMessage);
  }, [profileMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalMsg('');

    if (!name.trim() || !email.trim()) {
      setLocalMsg('Nama dan Email wajib diisi.');
      return;
    }
    if (password && password !== confirmPassword) {
      setLocalMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (password && password.length < 6) {
      setLocalMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setSaving(true);
    const payload = { name: name.trim(), email: email.trim() };
    if (password) payload.password = password;
    await onUpdateProfile(payload);
    if (logActivity) logActivity(`Memperbarui profil akun: ${name.trim()}`);
    setPassword('');
    setConfirmPassword('');
    setSaving(false);
  };

  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'superadmin' ? 'Super Admin' : 'Operator';
  const isSuccess = localMsg.toLowerCase().includes('berhasil');

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-[#0D9D1B] p-2 rounded-xl shadow-sm">
          <UserRound className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">Profil Akun</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Kelola informasi pribadi dan keamanan akun Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Edit Profile Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-2.5">
            <UserRound className="h-4 w-4 text-[#0D9D1B]" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Informasi Akun</h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Perbarui nama, email, dan kata sandi</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => { setLocalMsg(''); setName(e.target.value); }}
                    placeholder="Nama lengkap Anda"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 text-[13px] focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setLocalMsg(''); setEmail(e.target.value); }}
                    placeholder="email@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 text-[13px] focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Ubah Kata Sandi</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Kata Sandi Baru <span className="normal-case text-slate-400 font-medium">(opsional)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setLocalMsg(''); setPassword(e.target.value); }}
                      placeholder="Min. 6 karakter"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 text-[13px] placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setLocalMsg(''); setConfirmPassword(e.target.value); }}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 text-[13px] placeholder-slate-400 focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {localMsg && (
              <div className={`flex items-start gap-2 p-3 border rounded-lg text-[11px] font-semibold ${
                isSuccess
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {isSuccess
                  ? <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  : <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
                {localMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] disabled:opacity-60 text-white text-[12px] font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/20"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Akun'}
            </button>
          </form>
        </div>

        {/* Column 2: Session Info Card */}
        <div className="space-y-5">
          {/* Avatar / User card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-[#0D9D1B]/10 border-2 border-[#0D9D1B]/30 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-[#0D9D1B]">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-[15px] font-semibold text-slate-900">{user?.name || '—'}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{user?.email || '—'}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              user?.role === 'admin' || user?.role === 'superadmin'
                ? 'bg-[#0D9D1B]/10 text-[#0D9D1B]'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {roleLabel}
            </span>
          </div>

          {/* Info table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <ShieldCheck className="h-4 w-4 text-[#0D9D1B]" />
              <h2 className="text-[12px] font-semibold text-slate-800 uppercase tracking-wide">Detail Sesi</h2>
            </div>
            <div className="space-y-0 divide-y divide-slate-50 text-[12px]">
              {[
                { label: 'ID Pengguna', value: `ID-${user?.id || '—'}`, mono: true },
                { label: 'Hak Akses', value: roleLabel, green: true },
                { label: 'Status', value: 'Aktif', green: true },
              ].map(({ label, value, mono, green }) => (
                <div key={label} className="flex justify-between items-center py-2.5">
                  <span className="text-slate-400 font-medium">{label}</span>
                  <span className={`font-bold ${green ? 'text-[#0D9D1B]' : 'text-slate-800'} ${mono ? 'font-mono' : ''}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
