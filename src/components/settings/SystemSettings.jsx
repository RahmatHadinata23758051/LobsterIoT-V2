import React, { useState, useEffect, useRef } from 'react';
import { Settings, Globe, CheckCircle, ShieldAlert, Info, MapPin, Loader2 } from 'lucide-react';

export const SystemSettings = ({
  user,
  logoText,
  setLogoText,
  instansiName,
  setInstansiName,
  setLogoUrl,
  logActivity,
  token,
  api
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'su';

  // Branding States
  const [tempLogo, setTempLogo] = useState(logoText);
  const [tempInstansi, setTempInstansi] = useState(instansiName);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  const handleBrandingSubmit = async (e) => {
    e.preventDefault();
    if (!tempLogo.trim() || !tempInstansi.trim()) return;
    localStorage.setItem('slam_logo_text', tempLogo.trim());
    localStorage.setItem('slam_instansi_name', tempInstansi.trim());
    setLogoText(tempLogo.trim());
    setInstansiName(tempInstansi.trim());

    try {
      if (api && token) {
        if (logoFile) {
          const formData = new FormData();
          formData.append('system_logo_text', tempLogo.trim());
          formData.append('system_instansi_name', tempInstansi.trim());
          formData.append('logo_file', logoFile);
          
          const r = await api.updateSystemSettings(token, formData);
          const resData = await r.json();
          if (r.ok && resData.data && resData.data.system_logo_url) {
            localStorage.setItem('lobsense_logo_url', resData.data.system_logo_url);
            if (setLogoUrl) setLogoUrl(resData.data.system_logo_url);
            window.dispatchEvent(new Event('storage'));
          }
        } else {
          await api.updateSystemSettings(token, {
            system_logo_text: tempLogo.trim(),
            system_instansi_name: tempInstansi.trim()
          });
        }
      }
    } catch (err) {
      console.error(err);
    }

    if (logActivity) logActivity(`Mengubah branding sistem — Logo: "${tempLogo.trim()}", Instansi: "${tempInstansi.trim()}"`);
    setBrandingSuccess(true);
    setTimeout(() => setBrandingSuccess(false), 3500);
  };

  // Weather Coordinates & Regional States
  const [coords, setCoords] = useState({
    system_latitude: '',
    system_longitude: '',
    system_city_name: '',
    system_province_code: '',
    system_city_code: '',
    system_district_code: ''
  });

  // Regional Lists
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  // UI States
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [savingCoords, setSavingCoords] = useState(false);
  const [coordsSuccess, setCoordsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Leaflet Map Refs
  const leafletMapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const reverseGeocodeRef = useRef(null);

  // Inject custom marker styles
  useEffect(() => {
    if (!document.getElementById('leaflet-custom-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'leaflet-custom-marker-styles';
      style.innerHTML = `
        .custom-div-icon {
          background: none !important;
          border: none !important;
        }
        @keyframes custom-ping {
          0% { transform: scale(1); opacity: 1; }
          70%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .marker-pulse-ring {
          animation: custom-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Fetch initial coordinate and system settings
  useEffect(() => {
    if (!token || !api) return;
    const fetchCoords = async () => {
      setLoadingCoords(true);
      try {
        const r = await api.fetchSystemSettings(token);
        const data = await r.json();
        if (r.ok && data.status === 'success' && data.data) {
          setCoords({
            system_latitude: data.data.system_latitude || '',
            system_longitude: data.data.system_longitude || '',
            system_city_name: data.data.system_city_name || '',
            system_province_code: data.data.system_province_code || '',
            system_city_code: data.data.system_city_code || '',
            system_district_code: data.data.system_district_code || ''
          });
          if (data.data.system_logo_text) {
            setLogoText(data.data.system_logo_text);
            setTempLogo(data.data.system_logo_text);
          }
          if (data.data.system_instansi_name) {
            setInstansiName(data.data.system_instansi_name);
            setTempInstansi(data.data.system_instansi_name);
          }
        }
      } catch {
        setErrorMessage('Gagal memuat koordinat tambak dari server.');
      } finally {
        setLoadingCoords(false);
      }
    };
    fetchCoords();
  }, [token, api]);

  // Fetch provinces list
  useEffect(() => {
    if (!token || !api) return;
    const loadProvinces = async () => {
      try {
        const r = await api.fetchProvinces(token);
        const data = await r.json();
        if (r.ok && data.status === 'success') {
          setProvinces(data.data || []);
        }
      } catch {}
    };
    loadProvinces();
  }, [token, api]);

  // Fetch cities based on selected province code
  useEffect(() => {
    if (!token || !api) return;
    if (!coords.system_province_code) {
      setCities([]);
      setDistricts([]);
      return;
    }
    const loadCities = async () => {
      try {
        const r = await api.fetchCities(token, coords.system_province_code);
        const data = await r.json();
        if (r.ok && data.status === 'success') {
          setCities(data.data || []);
          setDistricts([]);
        }
      } catch {}
    };
    loadCities();
  }, [coords.system_province_code, token, api]);

  // Fetch districts based on selected city code
  useEffect(() => {
    if (!token || !api) return;
    if (!coords.system_city_code) {
      setDistricts([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const r = await api.fetchDistricts(token, coords.system_city_code);
        const data = await r.json();
        if (r.ok && data.status === 'success') {
          setDistricts(data.data || []);
        }
      } catch {}
    };
    loadDistricts();
  }, [coords.system_city_code, token, api]);

  // Reverse Geocoding function
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.address) return;

      const address = data.address;

      // 1. Match Province
      const nominatimState = (address.state || address.region || '').toUpperCase();
      if (!nominatimState) return;

      const matchedProvince = provinces.find(p => 
        p.name.toUpperCase().includes(nominatimState) || 
        nominatimState.includes(p.name.toUpperCase())
      );

      if (matchedProvince) {
        setCoords(prev => ({
          ...prev,
          system_province_code: matchedProvince.code,
          system_city_code: '',
          system_district_code: '',
          system_city_name: ''
        }));

        // Fetch cities list for matched province
        const rCities = await api.fetchCities(token, matchedProvince.code);
        const dataCities = await rCities.json();
        if (rCities.ok && dataCities.status === 'success') {
          const citiesList = dataCities.data || [];
          setCities(citiesList);

          // 2. Match City / Kabupaten
          const nominatimCity = (address.city || address.regency || address.county || address.municipality || '').toUpperCase();
          const cleanNominatimCity = nominatimCity.replace('KABUPATEN', '').replace('KOTA', '').trim();
          
          const matchedCity = citiesList.find(c => {
            const cleanCityName = c.name.toUpperCase().replace('KABUPATEN', '').replace('KOTA', '').trim();
            return cleanCityName.includes(cleanNominatimCity) || cleanNominatimCity.includes(cleanCityName);
          });

          if (matchedCity) {
            setCoords(prev => ({
              ...prev,
              system_city_code: matchedCity.code,
              system_district_code: '',
              system_city_name: ''
            }));

            // Fetch districts list for matched city
            const rDistricts = await api.fetchDistricts(token, matchedCity.code);
            const dataDistricts = await rDistricts.json();
            if (rDistricts.ok && dataDistricts.status === 'success') {
              const districtsList = dataDistricts.data || [];
              setDistricts(districtsList);

              // 3. Match District / Kecamatan
              const nominatimDistrict = (
                address.district || 
                address.city_district || 
                address.suburb || 
                address.town || 
                address.village || 
                address.municipality || 
                ''
              ).toUpperCase();

              const matchedDistrict = districtsList.find(d => 
                d.name.toUpperCase().includes(nominatimDistrict) || 
                nominatimDistrict.includes(d.name.toUpperCase())
              );

              if (matchedDistrict) {
                setCoords(prev => ({
                  ...prev,
                  system_district_code: matchedDistrict.code,
                  system_city_name: matchedDistrict.name
                }));
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  // Keep ref of reverseGeocode updated to avoid stale closures in Leaflet callbacks
  useEffect(() => {
    reverseGeocodeRef.current = reverseGeocode;
  }, [provinces, cities, districts, token, api]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!window.L) return;

    const container = document.getElementById('settings-map');
    if (!container) return;

    const latVal = parseFloat(coords.system_latitude) || -8.7233;
    const lngVal = parseFloat(coords.system_longitude) || 115.9083;

    // Create custom green marker icon
    const greenMarkerIcon = window.L.divIcon({
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 32px; height: 32px;">
          <div class="marker-pulse-ring" style="position: absolute; width: 32px; height: 32px; background-color: rgba(13, 157, 27, 0.4); border-radius: 50%;"></div>
          <div style="position: relative; width: 32px; height: 32px; background-color: #0D9D1B; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05); transform: translateY(-4px);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px; color: white;">
              <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.remove();
      leafletMapInstanceRef.current = null;
    }

    const map = window.L.map('settings-map', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([latVal, lngVal], 10);
    
    leafletMapInstanceRef.current = map;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = window.L.marker([latVal, lngVal], {
      draggable: isAdmin,
      icon: greenMarkerIcon
    }).addTo(map);
    
    markerRef.current = marker;

    if (isAdmin) {
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const lat = position.lat.toFixed(6);
        const lng = position.lng.toFixed(6);
        setCoords(prev => ({
          ...prev,
          system_latitude: lat,
          system_longitude: lng
        }));
        if (reverseGeocodeRef.current) {
          await reverseGeocodeRef.current(lat, lng);
        }
      });

      map.on('click', async (e) => {
        const position = e.latlng;
        marker.setLatLng(position);
        const lat = position.lat.toFixed(6);
        const lng = position.lng.toFixed(6);
        setCoords(prev => ({
          ...prev,
          system_latitude: lat,
          system_longitude: lng
        }));
        if (reverseGeocodeRef.current) {
          await reverseGeocodeRef.current(lat, lng);
        }
      });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 450);

    return () => {
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }
    };
  }, [isAdmin]);

  // Update map marker when latitude/longitude states change from manual input fields or GPS triggers
  useEffect(() => {
    if (leafletMapInstanceRef.current && markerRef.current) {
      const lat = parseFloat(coords.system_latitude);
      const lng = parseFloat(coords.system_longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const markerLatLng = markerRef.current.getLatLng();
        if (markerLatLng.lat !== lat || markerLatLng.lng !== lng) {
          markerRef.current.setLatLng([lat, lng]);
          leafletMapInstanceRef.current.setView([lat, lng], 12);
        }
      }
    }
  }, [coords.system_latitude, coords.system_longitude]);

  // Handle GPS location trigger
  const handleGetCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setCoords(prev => ({
            ...prev,
            system_latitude: lat,
            system_longitude: lng
          }));
          setCoordsSuccess(true);
          setTimeout(() => setCoordsSuccess(false), 3000);
          if (reverseGeocodeRef.current) {
            await reverseGeocodeRef.current(lat, lng);
          }
        },
        () => {
          alert('Akses lokasi ditolak atau GPS tidak aktif. Pastikan izin lokasi browser Anda aktif.');
        }
      );
    } else {
      alert('Browser Anda tidak mendukung Geolocation.');
    }
  };

  // Dropdown change handlers
  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setCoords(prev => ({
      ...prev,
      system_province_code: code,
      system_city_code: '',
      system_district_code: '',
      system_city_name: ''
    }));
  };

  const handleCityChange = (e) => {
    const code = e.target.value;
    setCoords(prev => ({
      ...prev,
      system_city_code: code,
      system_district_code: '',
      system_city_name: ''
    }));
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    const selectedDistrict = districts.find(d => d.code === code);
    const districtName = selectedDistrict ? selectedDistrict.name : '';
    setCoords(prev => ({
      ...prev,
      system_district_code: code,
      system_city_name: districtName
    }));
  };

  const handleCoordsSubmit = async (e) => {
    e.preventDefault();
    if (!coords.system_latitude || !coords.system_longitude || !coords.system_city_name) {
      alert('Seluruh kolom koordinat dan lokasi administratif wajib diisi.');
      return;
    }
    setSavingCoords(true);
    setErrorMessage(null);
    try {
      const r = await api.updateSystemSettings(token, {
        system_latitude: parseFloat(coords.system_latitude),
        system_longitude: parseFloat(coords.system_longitude),
        system_city_name: coords.system_city_name,
        system_province_code: coords.system_province_code,
        system_city_code: coords.system_city_code,
        system_district_code: coords.system_district_code
      });
      const data = await r.json();
      if (r.ok && data.status === 'success') {
        setCoordsSuccess(true);
        if (logActivity) logActivity(`Mengubah koordinat lokasi tambak — Wilayah: ${coords.system_city_name} (${coords.system_latitude}, ${coords.system_longitude})`);
        setTimeout(() => setCoordsSuccess(false), 3500);
      } else {
        setErrorMessage(data.message || 'Gagal menyimpan koordinat.');
      }
    } catch {
      setErrorMessage('Koneksi ke server bermasalah.');
    } finally {
      setSavingCoords(false);
    }
  };

  return (
    <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-2 pb-6 animate-[fadeIn_0.4s_ease-out]">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-[#0D9D1B] p-2 rounded-xl shadow-sm">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Konfigurasi branding, identitas instansi, dan koordinat administratif tambak utama berbasis Leaflet Map
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
            <h2 className="text-[15px] font-semibold text-slate-800 mb-1">Akses Terbatas</h2>
            <p className="text-[12px] text-slate-400 font-medium max-w-sm">
              Halaman ini hanya dapat diakses oleh pengguna dengan hak akses <span className="font-bold text-amber-600">Administrator</span>.
              Hubungi admin sistem untuk mengubah konfigurasi branding atau koordinat tambak.
            </p>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[11px] text-amber-700 font-semibold">
              Role Anda saat ini: <span className="uppercase font-semibold">{user?.role || '—'}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Columns (Form Branding & GPS Coordinates) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Branding Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-[#0D9D1B]" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Branding & Identitas</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    Ubah nama logo dan instansi yang tampil di seluruh aplikasi
                  </p>
                </div>
              </div>

              <form onSubmit={handleBrandingSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Nama Logo / Singkatan Sistem
                  </label>
                  <input
                    type="text"
                    required
                    value={tempLogo}
                    onChange={(e) => setTempLogo(e.target.value)}
                    placeholder="Contoh: LOBSENSE 1.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-[13px] font-bold focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                  />
                  <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Ditampilkan di sidebar kiri atas dan tab browser
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Upload Gambar / Logo Sistem (PNG / JPG / SVG)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#0D9D1B] hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-lg bg-slate-50 p-1"
                  />
                  <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Logo disinkronkan otomatis antara Website dan Mobile App
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-[12px] focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                  />
                  <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Ditampilkan di footer bawah setiap halaman
                  </p>
                </div>

                {brandingSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[10px] font-bold">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#0D9D1B]" />
                    Konfigurasi branding & logo sistem berhasil diperbarui secara instan!
                  </div>
                )}

                {/* Preview */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pratinjau Logo & Identitas</p>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="bg-[#0D9D1B] p-1 rounded-md shrink-0">
                      <img 
                        src={logoPreview || localStorage.getItem('lobsense_logo_url') || "/Icon.png"} 
                        alt="Logo" 
                        className="h-6 w-6 rounded-sm object-cover bg-white" 
                      />
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-slate-900 block leading-tight">{tempLogo || 'LOBSENSE 1.0'}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">LOBSTER SENSING SYSTEM</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">
                    Footer: <span className="font-semibold text-slate-600">
                      {tempLogo || 'LOBSENSE 1.0'} © 2026 · {tempInstansi || 'Balai Akuakultur Nusantara'}
                    </span>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white text-[11px] font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer shadow-sm shadow-green-500/20"
                >
                  Simpan Konfigurasi Branding
                </button>
              </form>
            </div>

            {/* Weather Coordinates Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
              
              {/* Absolute loading overlay to prevent map container unmounting */}
              {loadingCoords && (
                <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center text-xs text-slate-400 font-medium z-50 rounded-xl">
                  <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg shadow-md border border-slate-100">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0D9D1B]" />
                    Memuat data koordinat tambak...
                  </div>
                </div>
              )}

              <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#0D9D1B]" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Lokasi Fisik & Peta Administratif</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    Atur pusat koordinat fisik tambak dengan memilih wilayah administratif Indonesia & pin marker peta
                  </p>
                </div>
              </div>

              <form onSubmit={handleCoordsSubmit} className="space-y-4 text-xs">
                
                {/* Step 1: Dropdown Wilayah Berjenjang */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Provinsi *</label>
                    <select
                      required
                      value={coords.system_province_code}
                      onChange={handleProvinceChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map(prov => (
                        <option key={prov.code} value={prov.code}>{prov.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Kabupaten / Kota *</label>
                    <select
                      required
                      disabled={!coords.system_province_code}
                      value={coords.system_city_code}
                      onChange={handleCityChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition disabled:opacity-55"
                    >
                      <option value="">-- Pilih Kabupaten --</option>
                      {cities.map(city => (
                        <option key={city.code} value={city.code}>{city.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Kecamatan *</label>
                    <select
                      required
                      disabled={!coords.system_city_code}
                      value={coords.system_district_code}
                      onChange={handleDistrictChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition disabled:opacity-55"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map(dist => (
                        <option key={dist.code} value={dist.code}>{dist.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Nama Wilayah Terpilih (Cuaca)</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Pilih wilayah di atas..."
                    value={coords.system_city_name}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-slate-700 font-semibold focus:outline-none"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">
                    Secara otomatis terisi nama kecamatan terpilih sebagai identitas ramalan cuaca utama dasbor.
                  </p>
                </div>

                {/* Interactive Leaflet Map Wrapper */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Geser Pin Marker atau Klik Peta untuk Mengatur Koordinat</label>
                  <div className="rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
                    <div id="settings-map" className="h-[300px] w-full relative z-[5]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Garis Lintang (Latitude) *</label>
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        className="text-[9px] text-[#0D9D1B] hover:text-[#0A8516] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <MapPin className="h-3 w-3" /> Deteksi GPS Saya
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      placeholder="e.g. -8.723300"
                      value={coords.system_latitude}
                      onChange={(e) => setCoords({ ...coords, system_latitude: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Garis Bujur (Longitude) *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      placeholder="e.g. 115.908300"
                      value={coords.system_longitude}
                      onChange={(e) => setCoords({ ...coords, system_longitude: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#0D9D1B] focus:bg-white transition"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[10px] font-bold">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    {errorMessage}
                  </div>
                )}

                {coordsSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[10px] font-bold">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#0D9D1B]" />
                    Pengaturan lokasi administratif dan marker peta berhasil disimpan!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingCoords}
                  className="w-full py-2.5 bg-[#0D9D1B] hover:bg-[#0A8516] text-white text-[11px] font-semibold rounded-lg tracking-wider uppercase transition cursor-pointer disabled:opacity-50 shadow-sm shadow-green-500/20"
                >
                  {savingCoords ? 'Menyimpan...' : 'Simpan Lokasi & Koordinat'}
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Info Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Settings className="h-4 w-4 text-[#0D9D1B]" />
              <h2 className="text-[12px] font-semibold text-slate-800 uppercase tracking-wide">Konfigurasi Aktif</h2>
            </div>
            <div className="space-y-0 divide-y divide-slate-50 text-[11px]">
              {[
                { label: 'Nama Logo Aktif', value: logoText, bold: true },
                { label: 'Nama Instansi Aktif', value: instansiName },
                { label: 'Nama Wilayah Aktif', value: coords.system_city_name || '—' },
                { label: 'Latitude Tambak', value: coords.system_latitude || '—', mono: true },
                { label: 'Longitude Tambak', value: coords.system_longitude || '—', mono: true },
                { label: 'Dikelola oleh', value: user?.name || '—', green: true },
                { label: 'Role', value: user?.role || '—', mono: true, green: true },
              ].map(({ label, value, bold, mono, green }) => (
                <div key={label} className="flex justify-between items-center py-2.5 gap-2">
                  <span className="text-slate-400 font-medium shrink-0">{label}</span>
                  <span className={`font-semibold text-right truncate max-w-[140px] ${green ? 'text-[#0D9D1B]' : 'text-slate-800'} ${bold ? 'font-semibold' : ''} ${mono ? 'font-mono' : ''}`}>
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
