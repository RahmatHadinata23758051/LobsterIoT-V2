import React, { useState } from 'react';
import { RotateCcw, Trash2, User } from 'lucide-react';

export const OperatorManagement = ({
  operatorsList = [],
  loadingOperators,
  onAddOperator,
  onDeleteOperator,
  onRefresh
}) => {
  const [newOperator, setNewOperator] = useState({
    full_name: '',
    phone_number: '',
    address: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newOperator.full_name || !newOperator.phone_number || !newOperator.address) {
      alert('Seluruh kolom wajib diisi.');
      return;
    }
    onAddOperator(newOperator);
    setNewOperator({ full_name: '', phone_number: '', address: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Add Form */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="h-4 w-4 text-[#0D9D1B]" />
            Tambah Operator Baru
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Daftarkan petugas lapangan baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={newOperator.full_name}
              onChange={(e) => setNewOperator({ ...newOperator, full_name: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nomor Telepon *</label>
            <input
              type="text"
              required
              placeholder="Contoh: 081234567890"
              value={newOperator.phone_number}
              onChange={(e) => setNewOperator({ ...newOperator, phone_number: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Alamat Rumah *</label>
            <textarea
              required
              placeholder="Masukkan alamat rumah lengkap..."
              value={newOperator.address}
              onChange={(e) => setNewOperator({ ...newOperator, address: e.target.value })}
              rows="3"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/10"
          >
            Simpan Operator
          </button>
        </form>
      </div>

      {/* List Table */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Daftar Operator Lapangan</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Total data terdaftar pada basis data backend</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loadingOperators ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">Memuat data operator...</div>
        ) : operatorsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada operator terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Nama Lengkap</th>
                  <th className="px-4 py-2.5">No. Telepon</th>
                  <th className="px-4 py-2.5">Alamat</th>
                  <th className="px-4 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {operatorsList.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-400">{op.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{op.full_name}</td>
                    <td className="px-4 py-3 font-mono">{op.phone_number}</td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]" title={op.address}>
                      {op.address}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onDeleteOperator(op.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
