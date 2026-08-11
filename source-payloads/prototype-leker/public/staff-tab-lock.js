(() => {
  const metaRaw = sessionStorage.getItem('lekerStaffSessionMeta');
  if (!metaRaw) return;

  let meta;
  try { meta = JSON.parse(metaRaw); } catch { return; }
  if (!meta?.id || !meta?.role) return;

  const leaseKey = 'lekerStaffBrowserLease';
  const ttlMs = 15000;
  const heartbeatMs = 5000;
  const pageId = crypto.randomUUID();
  const handoffId = sessionStorage.getItem('lekerStaffHandoffId') || '';
  let blocked = false;

  const tokenKey = meta.role === 'OWNER'
    ? 'lekerOwnerToken'
    : meta.role === 'ADMIN'
      ? 'lekerAdminToken'
      : 'lekerCashierToken';

  function readLease() {
    try { return JSON.parse(localStorage.getItem(leaseKey) || 'null'); }
    catch { return null; }
  }

  function writeLease() {
    localStorage.setItem(leaseKey, JSON.stringify({
      owner: pageId,
      stage: 'active',
      staffId: meta.id,
      role: meta.role,
      updatedAt: Date.now()
    }));
  }

  function clearOwnLease() {
    const lease = readLease();
    if (lease?.owner === pageId) localStorage.removeItem(leaseKey);
  }

  function block(reason = 'Akun karyawan sedang aktif di tab lain.') {
    if (blocked) return;
    blocked = true;
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem('lekerStaffSessionMeta');
    sessionStorage.removeItem('lekerStaffHandoffId');
    document.documentElement.innerHTML = `
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tab Karyawan Terkunci</title></head>
      <body style="font-family:system-ui,sans-serif;background:#f5f2ed;margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;box-sizing:border-box">
        <main style="max-width:520px;background:white;border:1px solid #ddd5ca;border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.08)">
          <div style="font-size:32px">🔐</div><h1 style="margin:10px 0">Tab karyawan sudah aktif</h1>
          <p style="line-height:1.55;color:#655f58">${reason} Untuk mencegah bentrok identitas kerja dan laci, satu browser hanya boleh mempunyai satu tab karyawan aktif.</p>
          <a href="/?login=staff" style="display:inline-block;margin-top:8px;padding:11px 16px;border-radius:12px;background:#281f18;color:white;text-decoration:none;font-weight:800">Kembali ke Login Karyawan</a>
        </main>
      </body>`;
  }

  const existing = readLease();
  const existingActive = existing?.owner && Date.now() - Number(existing.updatedAt || 0) <= ttlMs;
  const isHandoff = handoffId && existing?.owner === handoffId;
  if (existingActive && !isHandoff) {
    block('Sudah ada tab karyawan aktif di browser ini. Gunakan tab tersebut atau tutup dulu tab yang lama.');
    return;
  }

  writeLease();
  sessionStorage.removeItem('lekerStaffHandoffId');

  const heartbeat = setInterval(() => {
    if (blocked) return;
    const lease = readLease();
    if (lease?.owner && lease.owner !== pageId && Date.now() - Number(lease.updatedAt || 0) <= ttlMs) {
      clearInterval(heartbeat);
      block('Tab karyawan lain mengambil slot aktif browser ini.');
      return;
    }
    writeLease();
  }, heartbeatMs);

  window.addEventListener('storage', event => {
    if (event.key !== leaseKey || blocked) return;
    const lease = readLease();
    if (lease?.owner && lease.owner !== pageId && Date.now() - Number(lease.updatedAt || 0) <= ttlMs) {
      clearInterval(heartbeat);
      block('Tab karyawan lain mengambil slot aktif browser ini.');
    }
  });

  window.addEventListener('beforeunload', clearOwnLease);
})();
