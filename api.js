window.api = (function(){
  // ------------- CONFIG -------------
  const BASE = window.API_BASE_URL || 'https://quickcommerce-b.onrender.com';
  const USE_MOCK = !!window.USE_MOCK;

  // ------------- HELPER FUNCTIONS -------------
  async function request(path, opts={}) {
    if (USE_MOCK) return mockHandler(path, opts);

    const tokens = AppState.getTokens();
    const headers = Object.assign({'Content-Type': 'application/json'}, opts.headers || {});
    if (tokens && tokens.access) headers['Authorization'] = 'Bearer ' + tokens.access;

    console.log(`[API REQUEST] ${opts.method || 'GET'} ${BASE + path}`);

    try {
      const res = await fetch(BASE + path, Object.assign({headers}, opts));

      if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          const tokens2 = AppState.getTokens();
          headers['Authorization'] = 'Bearer ' + tokens2.access;
          const res2 = await fetch(BASE + path, Object.assign({headers}, opts));
          return handleResponse(res2);
        } else {
          AppState.logout();
          throw {error: 'Session expired. Please login again.'};
        }
      }

      return handleResponse(res);

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw {error: 'Network error: Cannot connect to server'};
      }
      throw error;
    }
  }

  async function handleResponse(res) {
    let json = null;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        json = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }
    } catch (e) {
      console.error('Response parsing error:', e);
    }

    if (!res.ok) {
      throw json || {error: `Request failed with status ${res.status}`, status: res.status};
    }
    return json;
  }

  async function tryRefresh() {
    const tokens = AppState.getTokens();
    if (!tokens || !tokens.refresh) return false;

    try {
      const r = await fetch(BASE + '/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokens.refresh
        }
      });

      if (!r.ok) return false;

      const j = await r.json();
      AppState.setTokens({access: j.access_token, refresh: tokens.refresh});
      if (j.user) AppState.setUser(j.user);
      return true;
    } catch (e) {
      console.error('Refresh failed:', e);
      return false;
    }
  }

  // ------------- PUBLIC METHODS -------------
  return {
    get: (path) => request(path, {method: 'GET'}),
    post: (path, data) => request(path, {method: 'POST', body: JSON.stringify(data)}),
    put: (path, data) => request(path, {method: 'PUT', body: JSON.stringify(data)}),
    del: (path) => request(path, {method: 'DELETE'}),

    uploadCSV: async (path, formData) => {
      if (USE_MOCK) return mockHandler('/purchases/upload-csv', {method: 'POST', body: formData});
      const tokens = AppState.getTokens();
      const headers = {};
      if (tokens && tokens.access) headers['Authorization'] = 'Bearer ' + tokens.access;

      try {
        const res = await fetch(BASE + path, {method: 'POST', body: formData, headers});
        return handleResponse(res);
      } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw {error: 'Network error: Cannot connect to server'};
        }
        throw error;
      }
    }
  };

  // ------------- MOCK HANDLER (for dev only) -------------
  async function mockHandler(path, opts) {
    console.log('MOCK API: Handling', path, opts);
    await new Promise(r => setTimeout(r, 500));

    // Simple mock examples
    if (path.startsWith('/auth/login')) {
      return {access_token: 'mock-access', refresh_token: 'mock-refresh', user: {id: '1', name: 'Test', email: 'test@example.com'}};
    }
    if (path.startsWith('/auth/register')) {
      return {message: 'Mock register success', access_token: 'mock-access', refresh_token: 'mock-refresh', user: {id: '1', name: 'Test', email: 'test@example.com'}};
    }

    return {message: 'Mock response - not specifically handled', path: path, method: opts.method || 'GET'};
  }

})();

// ------------- INIT LOG -------------
console.log('API module loaded:', {BASE, USE_MOCK});
