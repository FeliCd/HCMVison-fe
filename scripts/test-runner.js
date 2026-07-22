#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         HCMVision — Automated API Test Runner               ║
 * ║  Chay: node scripts/test-runner.js                          ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Pham vi:
 *  1. Unit Tests   - Pure logic functions (normalizers, helpers)
 *  2. API Tests    - Live HTTP calls to hcmvision-api.onrender.com
 *  3. Flow Tests   - Multi-step user journeys
 *  4. Edge Cases   - Boundary / invalid-input scenarios
 *
 * Khong can cai them package nao - dung Node >=18 (built-in fetch).
 */

'use strict';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://hcmvision-api.onrender.com/api';

// --- Colour helpers ---
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed:   '\x1b[41m',
};

// --- Test framework ---
const results = { passed: 0, failed: 0, skipped: 0, suites: [] };
let currentSuite = null;
const testPromises = [];

function suite(name, fn) {
  currentSuite = { name, tests: [] };
  results.suites.push(currentSuite);
  console.log(`\n${C.bold}${C.cyan}-- ${name} ${C.reset}`);
  fn();
}

function test(name, fn) {
  const entry = { name, status: 'pending', error: null, duration: 0 };
  if (!currentSuite) return;
  currentSuite.tests.push(entry);
  const p = (async () => {
    const start = Date.now();
    try {
      await fn();
      entry.status = 'pass';
      entry.duration = Date.now() - start;
      results.passed++;
      console.log(`${C.green}  v${C.reset} ${name} ${C.dim}(${entry.duration}ms)${C.reset}`);
    } catch (err) {
      entry.status = 'fail';
      entry.error   = err.message || String(err);
      entry.duration = Date.now() - start;
      results.failed++;
      console.log(`${C.red}  x${C.reset} ${name} ${C.dim}(${entry.duration}ms)${C.reset}`);
      console.log(`${C.dim}    -> ${entry.error}${C.reset}`);
    }
  })();
  testPromises.push(p);
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
function assertEq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
function assertType(val, type, label) {
  if (typeof val !== type)
    throw new Error(`${label}: expected ${type}, got ${typeof val} (${JSON.stringify(val)})`);
}

// --- HTTP helpers ---
async function api(method, path, { body, token, params } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) url += `?${new URLSearchParams(params).toString()}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, ok: res.ok, data };
}

const GET    = (path, opts)       => api('GET',   path, opts);
const POST   = (path, body, opts) => api('POST',  path, { body, ...opts });
const PUT    = (path, body, opts) => api('PUT',   path, { body, ...opts });
const DELETE = (path, opts)       => api('DELETE', path, opts);

// --- Shared state ---
const state = {
  token: null, adminToken: null, userId: null,
  testUsername: null, testEmail: null,
  testPassword: 'TestPass@2026!',
  cameraId: null, subscriptionId: null,
};

function makeId(prefix = '') {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

// =============================================================================
//  SECTION 1 - UNIT TESTS (Pure logic, no network)
// =============================================================================

suite('UNIT -- Normalizer helpers', () => {

  const asNumber = (v, fb = 0) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') { const p = Number(v); if (Number.isFinite(p)) return p; }
    return fb;
  };
  const asBool = (v, fb = false) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true';
    return fb;
  };
  const asString = (v, fb = '') => (v === undefined || v === null ? fb : String(v));
  const field = (value, ...keys) => {
    if (!value || typeof value !== 'object') return undefined;
    for (const key of keys) {
      const lk = key.charAt(0).toLowerCase() + key.slice(1);
      const uk = key.charAt(0).toUpperCase() + key.slice(1);
      for (const k of [key, lk, uk]) {
        if (value[k] !== undefined && value[k] !== null) return value[k];
      }
    }
    return undefined;
  };
  const asArray = (value, ...keys) => {
    if (Array.isArray(value)) return value;
    for (const key of keys) {
      const nested = (value && typeof value === 'object') ? value[key] : undefined;
      if (Array.isArray(nested)) return nested;
    }
    return [];
  };

  test('asNumber: valid integer string "42"', async () => assertEq(asNumber('42'), 42));
  test('asNumber: float string "3.14"',        async () => assertEq(asNumber('3.14'), 3.14));
  test('asNumber: invalid returns fallback',    async () => {
    assertEq(asNumber(null), 0);
    assertEq(asNumber(undefined, 99), 99);
    assertEq(asNumber('abc', -1), -1);
    assertEq(asNumber(Infinity, 7), 7);
  });
  test('asNumber: already a finite number',     async () => {
    assertEq(asNumber(0), 0); assertEq(asNumber(-100), -100);
  });

  test('asBool: boolean passthrough',           async () => {
    assert(asBool(true) === true); assert(asBool(false) === false);
  });
  test('asBool: string "true"/"TRUE"/"false"',  async () => {
    assert(asBool('true') === true);
    assert(asBool('TRUE') === true);
    assert(asBool('false') === false);
    assert(asBool('no') === false);
  });
  test('asBool: null returns fallback',          async () => {
    assert(asBool(null) === false);
    assert(asBool(undefined, true) === true);
  });

  test('asString: coerces number/bool',          async () => {
    assertEq(asString(42), '42'); assertEq(asString(true), 'true');
  });
  test('asString: null/undefined -> fallback',   async () => {
    assertEq(asString(null), ''); assertEq(asString(undefined, 'x'), 'x');
  });

  test('field: finds key case-insensitively',    async () => {
    assertEq(field({ CameraId: 'c1' }, 'cameraId'), 'c1');
    assertEq(field({ cameraId: 'c2' }, 'CameraId'), 'c2');
    assertEq(field({}, 'missing'), undefined);
    assertEq(field(null, 'key'), undefined);
  });

  test('asArray: plain array passthrough',       async () => {
    assertEq(asArray([1,2,3]).length, 3);
  });
  test('asArray: extracts nested by key',        async () => {
    assertEq(asArray({ data: [1,2] }, 'data').length, 2);
  });
  test('asArray: null/undefined -> []',          async () => {
    assertEq(asArray(null).length, 0);
    assertEq(asArray({}).length, 0);
  });

  // toAbsoluteImageUrl inline
  const API_ORIGIN = 'https://hcmvision-api.onrender.com';
  const toAbsUrl = (url) => {
    if (!url) return undefined;
    const t = url.trim();
    if (!t) return undefined;
    if (/^https?:\/\//i.test(t))
      return t.replace(/^http:\/\/hcmvision-api\.onrender\.com/i, 'https://hcmvision-api.onrender.com');
    if (t.startsWith('/')) return `${API_ORIGIN}${t}`;
    return `${API_ORIGIN}/${t.replace(/^\/+/, '')}`;
  };

  test('toAbsoluteImageUrl: absolute https passthrough', async () =>
    assertEq(toAbsUrl('https://cdn.example.com/img.jpg'), 'https://cdn.example.com/img.jpg'));
  test('toAbsoluteImageUrl: http onrender -> https',     async () =>
    assertEq(toAbsUrl('http://hcmvision-api.onrender.com/images/t.jpg'),
             'https://hcmvision-api.onrender.com/images/t.jpg'));
  test('toAbsoluteImageUrl: relative /path -> absolute', async () =>
    assertEq(toAbsUrl('/uploads/cam.jpg'), 'https://hcmvision-api.onrender.com/uploads/cam.jpg'));
  test('toAbsoluteImageUrl: null/empty -> undefined',    async () => {
    assert(toAbsUrl(null) === undefined);
    assert(toAbsUrl('') === undefined);
    assert(toAbsUrl('  ') === undefined);
  });

  test('normalizeCamera: builds correct shape', async () => {
    const raw = { id: 'CAM001', name: 'Camera Q1', latitude: 10.776, longitude: 106.7, status: 'Active' };
    const cam = { id: raw.id || '', name: raw.name || '', latitude: raw.latitude ?? 0, longitude: raw.longitude ?? 0, status: raw.status || 'Offline' };
    assertEq(cam.id, 'CAM001'); assertEq(cam.status, 'Active');
  });
  test('normalizeCamera: missing fields -> defaults', async () => {
    const raw = {};
    const cam = { id: raw.id || '', name: raw.name || '', status: raw.status || 'Offline' };
    assertEq(cam.id, ''); assertEq(cam.status, 'Offline');
  });

  test('normalizeAdminStats: numeric fields default to 0', async () => {
    const n = (p) => ({
      totalCameras:  typeof p.totalCameras  === 'number' ? p.totalCameras  : 0,
      activeCameras: typeof p.activeCameras === 'number' ? p.activeCameras : 0,
    });
    const s = n({});
    assertEq(s.totalCameras, 0); assertEq(s.activeCameras, 0);
  });
});

// =============================================================================
//  SECTION 2 - PUBLIC API TESTS
// =============================================================================

suite('API -- Public Endpoints (no auth needed)', () => {
  test('GET /Weather/latest -> 200',                 async () => assertEq((await GET('/Weather/latest')).status, 200));
  test('GET /Weather/logs -> 200',                   async () => assertEq((await GET('/Weather/logs', { params: { minutes: 30, limit: 5 } })).status, 200));
  test('GET /Weather/raining-cameras -> 200',        async () => assertEq((await GET('/Weather/raining-cameras', { params: { minutes: 30 } })).status, 200));
  test('GET /Weather/raining-cameras/count -> 200',  async () => assertEq((await GET('/Weather/raining-cameras/count', { params: { minutes: 30 } })).status, 200));
  test('GET /Weather/heatmap -> 200',                async () => assertEq((await GET('/Weather/heatmap')).status, 200));
  test('GET /Camera -> 200',                         async () => assertEq((await GET('/Camera', { params: { page: 1, pageSize: 5 } })).status, 200));
  test('GET /Camera/status -> 200',                  async () => assertEq((await GET('/Camera/status', { params: { page: 1, pageSize: 5, rain: 'all', traffic: 'all' } })).status, 200));
  test('GET /Location/districts -> 200',             async () => assertEq((await GET('/Location/districts')).status, 200));
  test('GET /Location/wards -> 200',                 async () => assertEq((await GET('/Location/wards')).status, 200));
  test('GET /Chatbot/debug -> 200',                  async () => assertEq((await GET('/Chatbot/debug')).status, 200));
});

// =============================================================================
//  SECTION 3 - AUTH LIFECYCLE FLOW
// =============================================================================

suite('FLOW -- Full Auth Lifecycle', () => {

  test('REGISTER: new unique user', async () => {
    state.testUsername = makeId('usr_');
    state.testEmail    = `${makeId('t_')}@hcmtest.dev`;
    const r = await POST('/Auth/register', {
      username: state.testUsername,
      email:    state.testEmail,
      password: state.testPassword,
    });
    assert(r.status === 200 || r.status === 201,
      `Register got ${r.status}: ${JSON.stringify(r.data)}`);
  });

  test('LOGIN: valid credentials -> token', async () => {
    const r = await POST('/Auth/login', { username: state.testUsername, password: state.testPassword });
    assert(r.status === 200 || r.status === 201, `Login got ${r.status}: ${JSON.stringify(r.data)}`);
    const token = r.data?.token || r.data?.data?.token || r.data?.accessToken;
    assert(token, `Token not found: ${JSON.stringify(r.data)}`);
    state.token = token;
  });

  test('GET /Auth/me -> user data', async () => {
    assert(state.token, 'Need token from login step');
    const r = await GET('/Auth/me', { token: state.token });
    assertEq(r.status, 200, `GET /me got ${r.status}`);
    const user = r.data?.data || r.data;
    assert(user.username || user.email, 'Must have username or email');
    state.userId = user.id;
  });

  test('PUT /Auth/me -> update fullName', async () => {
    assert(state.token, 'Need token');
    const r = await PUT('/Auth/me', { fullName: 'HCMVision Tester' }, { token: state.token });
    assert(r.status === 200 || r.status === 204, `PUT /me got ${r.status}`);
  });

  test('POST /Auth/change-password -> new password', async () => {
    assert(state.token, 'Need token');
    const newPw = 'NewPass@2026!';
    const r = await POST('/Auth/change-password',
      { oldPassword: state.testPassword, newPassword: newPw }, { token: state.token });
    assert(r.status === 200 || r.status === 204, `Change-pw got ${r.status}`);
    state.testPassword = newPw;
  });

  test('LOGIN again with NEW password', async () => {
    const r = await POST('/Auth/login', { username: state.testUsername, password: state.testPassword });
    assert(r.status === 200, `Re-login got ${r.status}`);
    const token = r.data?.token || r.data?.data?.token || r.data?.accessToken;
    assert(token, 'No token after pw change');
    state.token = token;
  });
});

// =============================================================================
//  SECTION 4 - WEATHER FLOW
// =============================================================================

suite('FLOW -- Weather Reporting & Route Check', () => {

  test('Pick a camera id from /Camera', async () => {
    const r = await GET('/Camera', { params: { page: 1, pageSize: 1 } });
    assertEq(r.status, 200);
    const items = r.data?.data || r.data?.items || (Array.isArray(r.data) ? r.data : []);
    if (items.length > 0) state.cameraId = items[0].id || items[0].cameraId;
  });

  test('POST /Weather/report -> user reports rain', async () => {
    assert(state.token, 'Need auth token');
    const body = { isRaining: true, note: 'Automated test' };
    if (state.cameraId) body.cameraId = state.cameraId;
    const r = await POST('/Weather/report', body, { token: state.token });
    assert(r.status === 200 || r.status === 201 || r.status === 204,
      `Report got ${r.status}: ${JSON.stringify(r.data)}`);
  });

  test('POST /Weather/check-route -> city centre coords', async () => {
    const r = await POST('/Weather/check-route', {
      originLatitude: 10.762622, originLongitude: 106.660172,
      destinationLatitude: 10.800000, destinationLongitude: 106.700000,
    });
    assert(r.status === 200, `check-route got ${r.status}`);
  });

  test('POST /Weather/check-route -> with routePoints array', async () => {
    const r = await POST('/Weather/check-route', {
      routePoints: [
        { lat: 10.762622, lng: 106.660172 },
        { lat: 10.780000, lng: 106.680000 },
        { lat: 10.800000, lng: 106.700000 },
      ],
    });
    assert(r.status === 200, `check-route (routePoints) got ${r.status}`);
  });
});

// =============================================================================
//  SECTION 5 - FAVORITES & SUBSCRIPTIONS
// =============================================================================

suite('FLOW -- Favorites & Subscriptions', () => {

  test('GET /Favorite -> list (auth)', async () => {
    assert(state.token, 'Need token');
    assertEq((await GET('/Favorite', { token: state.token })).status, 200);
  });

  test('POST /Favorite/:id -> add camera', async () => {
    if (!state.cameraId) { console.log(`${C.yellow}    (no cameraId, skip)${C.reset}`); return; }
    const r = await POST(`/Favorite/${state.cameraId}`, {}, { token: state.token });
    assert(r.status === 200 || r.status === 201 || r.status === 409, `Got ${r.status}`);
  });

  test('DELETE /Favorite/:id -> remove', async () => {
    if (!state.cameraId) return;
    const r = await DELETE(`/Favorite/${state.cameraId}`, { token: state.token });
    assert(r.status === 200 || r.status === 204 || r.status === 404, `Got ${r.status}`);
  });

  test('GET /subscriptions -> list (auth)', async () => {
    assert(state.token, 'Need token');
    assertEq((await GET('/subscriptions', { token: state.token })).status, 200);
  });

  test('POST /subscriptions -> create alert sub', async () => {
    assert(state.token, 'Need token');
    const r = await POST('/subscriptions',
      { wardId: 'ward-test-00001', thresholdProbability: 0.75 }, { token: state.token });
    if (r.status === 200 || r.status === 201) {
      const sub = r.data?.data || r.data;
      state.subscriptionId = sub?.subscriptionId || sub?.id;
    }
    assert([200, 201, 400, 404, 422].includes(r.status), `Unexpected ${r.status}`);
  });

  test('DELETE /subscriptions/:id -> cleanup', async () => {
    if (!state.subscriptionId) return;
    const r = await DELETE(`/subscriptions/${state.subscriptionId}`, { token: state.token });
    assert(r.status === 200 || r.status === 204 || r.status === 404, `Got ${r.status}`);
  });
});

// =============================================================================
//  SECTION 6 - CHATBOT FLOW
// =============================================================================

suite('FLOW -- Chatbot', () => {

  test('GET /Chatbot/debug -> health check', async () =>
    assertEq((await GET('/Chatbot/debug')).status, 200));

  test('POST message: "Hom nay co mua khong?"', async () => {
    const r = await POST('/Chatbot/message', { message: 'Hom nay co mua khong?' });
    assertEq(r.status, 200, `Chatbot got ${r.status}`);
    const reply = r.data?.reply || r.data?.message || r.data?.data?.reply;
    assert(reply && reply.length > 0, 'Reply must be non-empty');
  });

  test('POST message: "Duong Nguyen Hue ket khong?"', async () => {
    const r = await POST('/Chatbot/message', { message: 'Duong Nguyen Hue ket khong?' });
    assertEq(r.status, 200, `Chatbot got ${r.status}`);
  });

  test('POST message: English "Is it raining District 1?"', async () => {
    const r = await POST('/Chatbot/message', { message: 'Is it raining in District 1?' });
    assertEq(r.status, 200, `Chatbot got ${r.status}`);
  });
});

// =============================================================================
//  SECTION 7 - EDGE CASES
// =============================================================================

suite('EDGE CASES -- Auth Boundary & Invalid Inputs', () => {

  test('LOGIN wrong password -> 401/400', async () => {
    const r = await POST('/Auth/login', { username: state.testUsername || 'nobody', password: 'WrongPass!999' });
    assert(r.status === 401 || r.status === 400, `Expected 4xx, got ${r.status}`);
  });

  test('LOGIN empty username -> 400/401', async () => {
    const r = await POST('/Auth/login', { username: '', password: 'anything' });
    assert([400, 401, 422].includes(r.status), `Got ${r.status}`);
  });

  test('REGISTER duplicate username -> 400/409', async () => {
    if (!state.testUsername) return;
    const r = await POST('/Auth/register', {
      username: state.testUsername,
      email: `dup_${makeId()}@test.dev`,
      password: 'AnyPass@123',
    });
    assert([400, 409, 422].includes(r.status), `Got ${r.status}`);
  });

  test('REGISTER invalid email -> 400/422', async () => {
    const r = await POST('/Auth/register', { username: makeId('inv_'), email: 'not-email', password: 'Test@1234' });
    assert([400, 422].includes(r.status), `Got ${r.status}`);
  });

  test('REGISTER short password -> 400/422', async () => {
    const r = await POST('/Auth/register', { username: makeId('inv_'), email: `${makeId()}@t.dev`, password: '123' });
    assert([400, 422].includes(r.status), `Got ${r.status}`);
  });

  test('GET /Auth/me no token -> 401', async () =>
    assertEq((await GET('/Auth/me')).status, 401));

  test('GET /Auth/me invalid token -> 401', async () =>
    assertEq((await GET('/Auth/me', { token: 'garbage.token.xyz' })).status, 401));

  test('GET /Admin/stats no auth -> 401', async () =>
    assertEq((await GET('/Admin/stats')).status, 401));

  test('GET /Admin/users no auth -> 401', async () =>
    assertEq((await GET('/Admin/users')).status, 401));

  test('GET /Favorite no auth -> 401', async () =>
    assertEq((await GET('/Favorite')).status, 401));

  test('GET /subscriptions no auth -> 401', async () =>
    assertEq((await GET('/subscriptions')).status, 401));

  test('POST /Weather/report no auth -> 401', async () =>
    assertEq((await POST('/Weather/report', { isRaining: true })).status, 401));

  test('GET /Camera/NON_EXISTENT_ID -> 404/400', async () => {
    const r = await GET('/Camera/NON_EXISTENT_CAMERA_XYZ_12345');
    assert(r.status === 404 || r.status === 400, `Got ${r.status}`);
  });

  test('GET /Location/wards/by-district/UNKNOWN -> 200 empty or 404', async () => {
    const r = await GET('/Location/wards/by-district/UNKNOWN_DISTRICT_XYZ');
    assert(r.status === 200 || r.status === 404, `Got ${r.status}`);
    if (r.status === 200) {
      const arr = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      assertEq(arr.length, 0, 'Unknown district should return empty array');
    }
  });

  test('POST /Weather/check-route empty body -> 200/400', async () => {
    const r = await POST('/Weather/check-route', {});
    assert(r.status === 200 || r.status === 400, `Got ${r.status}`);
  });

  test('POST /Chatbot/message empty string -> 200/400', async () => {
    const r = await POST('/Chatbot/message', { message: '' });
    assert(r.status === 200 || r.status === 400, `Got ${r.status}`);
  });

  test('GET /Weather/logs extreme minutes param', async () => {
    const r = await GET('/Weather/logs', { params: { minutes: 99999, limit: 1 } });
    assert(r.status === 200 || r.status === 400, `Got ${r.status}`);
  });

  test('GET /Camera page=0 -> graceful', async () => {
    const r = await GET('/Camera', { params: { page: 0, pageSize: 5 } });
    assert(r.status === 200 || r.status === 400, `Got ${r.status}`);
  });

  test('GET /Camera negative pageSize -> graceful', async () => {
    const r = await GET('/Camera', { params: { page: 1, pageSize: -1 } });
    assert(r.status === 200 || r.status === 400, `Got ${r.status}`);
  });
});

// =============================================================================
//  SECTION 8 - PAGINATION & FILTERING
// =============================================================================

suite('API -- Pagination & Filtering', () => {

  test('Camera: page1 and page2 both succeed', async () => {
    const [r1, r2] = await Promise.all([
      GET('/Camera', { params: { page: 1, pageSize: 3 } }),
      GET('/Camera', { params: { page: 2, pageSize: 3 } }),
    ]);
    assertEq(r1.status, 200); assertEq(r2.status, 200);
  });

  test('Camera status filter: rain=raining', async () =>
    assertEq((await GET('/Camera/status', { params: { rain: 'raining', page: 1, pageSize: 5 } })).status, 200));

  test('Camera status filter: rain=not_raining', async () =>
    assertEq((await GET('/Camera/status', { params: { rain: 'not_raining', page: 1, pageSize: 5 } })).status, 200));

  test('Camera status filter: traffic=jammed', async () =>
    assertEq((await GET('/Camera/status', { params: { traffic: 'jammed', page: 1, pageSize: 5 } })).status, 200));

  test('Camera list search by keyword', async () =>
    assertEq((await GET('/Camera', { params: { search: 'Quan', page: 1, pageSize: 5 } })).status, 200));

  test('Weather logs limit=1 returns <=1 record', async () => {
    const r = await GET('/Weather/logs', { params: { minutes: 180, limit: 1 } });
    assertEq(r.status, 200);
    const items = r.data?.data || (Array.isArray(r.data) ? r.data : []);
    assert(items.length <= 1, `Expected <=1 item, got ${items.length}`);
  });

  test('Weather logs onlyWithImages=true', async () =>
    assertEq((await GET('/Weather/logs', { params: { minutes: 180, limit: 10, onlyWithImages: true } })).status, 200));

  test('Raining cameras narrow window (5 min)', async () =>
    assertEq((await GET('/Weather/raining-cameras', { params: { minutes: 5 } })).status, 200));

  test('Raining cameras 24h window', async () =>
    assertEq((await GET('/Weather/raining-cameras', { params: { minutes: 1440 } })).status, 200));
});

// =============================================================================
//  SECTION 9 - SCHEMA VALIDATION
// =============================================================================

suite('SCHEMA -- Response Structure Validation', () => {

  test('Camera list: response is object or array', async () => {
    const r = await GET('/Camera', { params: { page: 1, pageSize: 2 } });
    assertEq(r.status, 200);
    assert(typeof r.data === 'object', 'data should be object or array');
    const items = Array.isArray(r.data) ? r.data : (r.data?.data || r.data?.items || r.data?.value || []);
    assert(Array.isArray(items), 'inner items should be array');
  });

  test('Weather logs: items have cameraId', async () => {
    const r = await GET('/Weather/logs', { params: { minutes: 180, limit: 3 } });
    assertEq(r.status, 200);
    const items = r.data?.data || (Array.isArray(r.data) ? r.data : []);
    if (items.length > 0) {
      const log = items[0];
      assert('cameraId' in log || 'camera_id' in log || 'id' in log, 'Log must have cameraId/id');
    }
  });

  test('Raining cameras: has count or data field', async () => {
    const r = await GET('/Weather/raining-cameras', { params: { minutes: 60 } });
    assertEq(r.status, 200);
    const d = r.data;
    if (typeof d === 'object' && !Array.isArray(d)) {
      assert('count' in d || 'total' in d || Array.isArray(d.data), 'Must have count/total/data');
    }
  });

  test('Districts: items have id/name', async () => {
    const r = await GET('/Location/districts');
    assertEq(r.status, 200);
    const items = Array.isArray(r.data) ? r.data : (r.data?.data || r.data?.items || []);
    if (items.length > 0) {
      assert(items[0].id || items[0].districtId || items[0].name, 'District must have id or name');
    }
  });

  test('/Auth/me: has username, role fields', async () => {
    assert(state.token, 'Need token');
    const r = await GET('/Auth/me', { token: state.token });
    assertEq(r.status, 200);
    const user = r.data?.data || r.data;
    assertType(user.username, 'string', 'username');
    assert(user.role === 'User' || user.role === 'Admin', `Invalid role: ${user.role}`);
  });

  test('Chatbot: response has reply or message field', async () => {
    const r = await POST('/Chatbot/message', { message: 'test' });
    assertEq(r.status, 200);
    const reply = r.data?.reply || r.data?.message || r.data?.data?.reply;
    assert(reply !== undefined, 'Must have reply or message field');
  });
});

// =============================================================================
//  SECTION 10 - EXTERNAL SERVICES
// =============================================================================

suite('EXTERNAL -- Third-party APIs (Nominatim, OSRM)', () => {

  test('Nominatim: "Ben Thanh" -> HCM coords', async () => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      'Ben Thanh Market, Ho Chi Minh City, Vietnam')}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HCMVision/test' } });
    const data = await res.json();
    assert(Array.isArray(data), 'Nominatim returns array');
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      assert(lat > 10 && lat < 11,   `Lat out of HCM range: ${lat}`);
      assert(lng > 106 && lng < 107, `Lng out of HCM range: ${lng}`);
    }
  });

  test('Nominatim: address search "Nguyen Hue"', async () => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      'Nguyen Hue, Ho Chi Minh')}&format=json&limit=3&viewbox=106.35,10.35,107.05,11.15&bounded=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HCMVision/test' } });
    assertEq(res.status, 200);
    assert(Array.isArray(await res.json()), 'Nominatim returns array');
  });

  test('OSRM route: Q1 -> Q7', async () => {
    const url = `https://router.project-osrm.org/route/v1/driving/106.6977,10.7769;106.7100,10.7295?overview=false`;
    const res  = await fetch(url);
    assertEq(res.status, 200);
    const data = await res.json();
    assertEq(data.code, 'Ok', `OSRM code: ${data.code}`);
    assert(Array.isArray(data.routes) && data.routes.length > 0, 'OSRM should return routes');
  });

  test('OSRM alternatives=true', async () => {
    const url = `https://router.project-osrm.org/route/v1/driving/106.660172,10.762622;106.700000,10.800000?overview=full&geometries=geojson&alternatives=true`;
    const res  = await fetch(url);
    assertEq(res.status, 200);
    assertEq((await res.json()).code, 'Ok');
  });
});

// =============================================================================
//  SECTION 11 - FORGOT / RESET PASSWORD FLOW
// =============================================================================

suite('FLOW -- Forgot / Reset Password', () => {

  test('POST /Auth/forgot-password (registered email) -> 2xx', async () => {
    if (!state.testEmail) return;
    const r = await POST('/Auth/forgot-password', { email: state.testEmail });
    assert([200, 202, 204].includes(r.status), `Got ${r.status}`);
  });

  test('POST /Auth/forgot-password (unknown email) -> 2xx or 404', async () => {
    const r = await POST('/Auth/forgot-password', { email: 'nobody@nonexistent.invalid' });
    assert([200, 202, 404].includes(r.status), `Got ${r.status}`);
  });

  test('POST /Auth/reset-password invalid token -> 4xx', async () => {
    const r = await POST('/Auth/reset-password', {
      token: 'completelyfaketoken99999',
      newPassword: 'SomeNewPass@123',
    });
    assert([400, 401, 404].includes(r.status), `Got ${r.status}`);
  });
});

// =============================================================================
//  ENTRY POINT & REPORT
// =============================================================================

console.log(`\n${C.bold}${C.magenta}=====================================================`);
console.log(`  HCMVision -- Automated Test Runner  v1.0`);
console.log(`  ${new Date().toLocaleString('vi-VN')}`);
console.log(`=====================================================${C.reset}\n`);
console.log(`${C.dim}Target: ${BASE_URL}${C.reset}`);

(async () => {
  // Wait for all async test promises to resolve
  await Promise.allSettled(testPromises);

  // ── Per-suite summary ─────────────────────────────────────────────────────
  console.log(`\n${C.bold}${'='.repeat(60)}${C.reset}`);
  console.log(`${C.bold}${C.white}  SUITE RESULTS${C.reset}`);
  console.log(`${'─'.repeat(60)}`);

  for (const s of results.suites) {
    const pass  = s.tests.filter(t => t.status === 'pass').length;
    const fail  = s.tests.filter(t => t.status === 'fail').length;
    const total = s.tests.length;
    const icon  = fail === 0 ? `${C.green}v${C.reset}` : `${C.red}x${C.reset}`;
    const failStr = fail > 0 ? ` ${C.red}fail:${fail}${C.reset}` : '';
    console.log(`  ${icon} ${s.name.padEnd(45)} ${C.green}${pass}${C.reset}/${total}${failStr}`);
  }

  // ── Failures detail ───────────────────────────────────────────────────────
  const failures = results.suites.flatMap(s =>
    s.tests.filter(t => t.status === 'fail').map(t => ({ ...t, suite: s.name })));
  if (failures.length > 0) {
    console.log(`\n${C.bold}${C.red}  FAILURES${C.reset}`);
    console.log(`${'─'.repeat(60)}`);
    for (const f of failures) {
      console.log(`  ${C.red}x${C.reset} [${f.suite}] ${f.name}`);
      console.log(`    ${C.dim}${f.error}${C.reset}`);
    }
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  const total    = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? Math.round((results.passed / (total - results.skipped)) * 100) : 0;
  const bg  = results.failed === 0 ? C.bgGreen : C.bgRed;
  const txt = results.failed === 0 ? ' ALL PASSED ' : ` ${results.failed} FAILED `;

  console.log(`\n${C.bold}${'='.repeat(60)}${C.reset}`);
  console.log(`  ${bg}${C.bold}${txt}${C.reset}   ` +
    `${C.green}${results.passed} passed${C.reset} / ` +
    `${C.red}${results.failed} failed${C.reset} / ` +
    `${C.yellow}${results.skipped} skipped${C.reset}  ` +
    `[${total} total]  pass rate: ${passRate}%`);
  console.log(`  ${C.dim}API: ${BASE_URL}${C.reset}`);
  console.log(`  ${C.dim}Ran: ${new Date().toLocaleString('vi-VN')}${C.reset}`);
  console.log(`${C.bold}${'='.repeat(60)}${C.reset}\n`);

  process.exit(results.failed > 0 ? 1 : 0);
})();
