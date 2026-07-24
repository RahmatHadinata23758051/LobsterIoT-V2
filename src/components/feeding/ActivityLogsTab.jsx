import React, { useState } from 'react';
import { Clock, Search, Filter, User, Activity, RefreshCw } from 'lucide-react';

export const ActivityLogsTab = ({ activityLogs = [], onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Filter activity logs
  const filteredLogs = activityLogs.filter(log => {
    const userName = (log.userName || log.user || 'Sistem / Operator').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const role = (log.role || 'operator').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = userName.includes(term) || action.includes(term);
    const matchesRole = roleFilter === 'all' || role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Calculate pagination
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out] font-sans">
      
      {/* Header Bar */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-[#0D9D1B]" />
            <span>Log Aktivitas Sistem</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat terstruktur seluruh tindakan pengguna dan pemicu otomatis sistem dalam platform Lobsense
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#0D9D1B]" />
            <span>Segarkan Log</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pengguna atau deskripsi aktivitas..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0D9D1B]"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0D9D1B] cursor-pointer"
            >
              <option value="all">Semua Peran / Role</option>
              <option value="admin">Administrator (Admin)</option>
              <option value="operator">Petugas (Operator)</option>
              <option value="system">Sistem Otomatis</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
          Total: <span className="text-[#0D9D1B]">{totalItems}</span> Catatan
        </div>
      </div>

      {/* Structured Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs font-medium bg-slate-50/20">
              Tidak ada log aktivitas yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            <table className="w-full text-[12px] text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center w-14">No</th>
                  <th className="px-4 py-3 text-left">Nama User / Pengguna</th>
                  <th className="px-4 py-3 text-center w-36">Peran / Role</th>
                  <th className="px-4 py-3 text-left">Deskripsi Aktivitas</th>
                  <th className="px-4 py-3 text-center w-48">Waktu Pelaksanaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log, idx) => {
                  const role = (log.role || 'operator').toLowerCase();
                  const isSystem = role === 'system' || (log.userName || '').includes('Sistem');

                  return (
                    <tr key={log.id || idx} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-400">
                        {startIndex + idx + 1}
                      </td>
                      
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isSystem ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                            {isSystem ? <Activity className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                          </div>
                          <span>{log.userName || log.user || 'Sistem / Operator'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          role === 'system' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-emerald-50 text-[#0D9D1B] border border-emerald-200'
                        }`}>
                          {log.role || 'Operator'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-800 font-medium leading-relaxed">
                        {log.action}
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.formattedTime || log.time || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span>–<span className="font-bold text-slate-800">{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> log
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                Sebelumnya
              </button>

              <span className="px-3 py-1 text-xs font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
