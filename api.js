window.api = (function(){
  const BASE = window.API_BASE_URL || '';
  const USE_MOCK = !!window.USE_MOCK;

  async function request(path, opts={}){
    if(USE_MOCK) return mockHandler(path, opts);
    
    const tokens = AppState.getTokens();
    const headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {});
    if(tokens && tokens.access) headers['Authorization'] = 'Bearer ' + tokens.access;
    
    try {
      const res = await fetch(BASE + path, Object.assign({headers}, opts));
      
      if(res.status === 401){
        // try refresh token
        const refreshed = await tryRefresh();
        if(refreshed){
          const tokens2 = AppState.getTokens();
          headers['Authorization'] = 'Bearer ' + tokens2.access;
          const res2 = await fetch(BASE + path, Object.assign({headers}, opts));
          return handleResponse(res2);
        } else {
          // Refresh failed, logout user
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

  async function handleResponse(res){
    let json = null;
    try { 
      // Check if response has content
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        json = await res.json();
      } else {
        // If not JSON, try to get text for error message
        const text = await res.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }
    } catch(e){ 
      console.error('Response parsing error:', e);
      json = null; 
    }
    
    if(!res.ok) {
      throw json || {error:`Request failed with status ${res.status}`, status: res.status};
    }
    return json;
  }

  async function tryRefresh(){
    const tokens = AppState.getTokens();
    if(!tokens || !tokens.refresh) return false;
    
    try {
      const r = await fetch(BASE + '/auth/refresh', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokens.refresh
        }
      });
      
      if(!r.ok) return false;
      
      const j = await r.json();
      // Update tokens and user
      AppState.setTokens({
        access: j.access_token, 
        refresh: tokens.refresh // Keep the same refresh token
      });
      if (j.user) {
        AppState.setUser(j.user);
      }
      return true;
    } catch(e){ 
      console.error('Refresh failed:', e);
      return false; 
    }
  }

  // Public methods
  return {
    get: (path) => request(path, {method:'GET'}),
    post: (path, data) => request(path, {method:'POST', body: JSON.stringify(data)}),
    put: (path, data) => request(path, {method:'PUT', body: JSON.stringify(data)}),
    del: (path) => request(path, {method:'DELETE'}),
    
    uploadCSV: async (path, formData) => {
      if(USE_MOCK) return mockHandler('/purchases/upload-csv', {method:'POST', body: formData});
      const tokens = AppState.getTokens();
      const headers = {};
      if(tokens && tokens.access) headers['Authorization'] = 'Bearer ' + tokens.access;
      
      try {
        const res = await fetch(BASE + path, {method:'POST', body: formData, headers});
        return handleResponse(res);
      } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw {error: 'Network error: Cannot connect to server'};
        }
        throw error;
      }
    }
  };

  // --- Mock handler: return canned responses for dev without backend ---
  async function mockHandler(path, opts){
    console.log('MOCK API: Handling', path, opts);
    await new Promise(r=>setTimeout(r, 500)); // Simulate network delay
    
    // AUTH ENDPOINTS
    if(path.startsWith('/auth/register')){
      const body = JSON.parse(opts.body || '{}');
      console.log('MOCK: Register attempt for', body.email);
      
      // Simulate user already exists
      if(body.email === 'exists@example.com') {
        throw {error: 'User already exists', status: 409};
      }
      
      const tokens = {
        access: 'mock-access-token-' + Date.now(), 
        refresh: 'mock-refresh-token-' + Date.now()
      };
      
      const user = {
        id: 'mock-user-' + Date.now(), 
        name: body.name || 'New User', 
        email: body.email
      };
      
      AppState.setTokens(tokens);
      AppState.setUser(user);
      
      return {
        message: 'User registered successfully',
        access_token: tokens.access,
        refresh_token: tokens.refresh,
        user: user
      };
    }
    
    if(path.startsWith('/auth/login')){
      const body = JSON.parse(opts.body || '{}');
      console.log('MOCK: Login attempt for', body.email);
      
      // Simulate invalid credentials
      if(body.email === 'wrong@example.com' || body.password === 'wrong') {
        throw {error: 'Invalid credentials', status: 401};
      }
      
      // Successful login
      const tokens = {
        access: 'mock-access-token-' + Date.now(), 
        refresh: 'mock-refresh-token-' + Date.now()
      };
      
      const user = {
        id: 'mock-user-123', 
        name: 'Test User', 
        email: body.email || 'test@example.com'
      };
      
      AppState.setTokens(tokens);
      AppState.setUser(user);
      
      return {
        access_token: tokens.access,
        refresh_token: tokens.refresh,
        user: user
      };
    }
    
    if(path.startsWith('/auth/refresh')){
      const tokens = {
        access: 'mock-refreshed-token-' + Date.now(), 
        refresh: 'mock-refresh-token-' + Date.now()
      };
      
      AppState.setTokens(tokens);
      
      return {
        access_token: tokens.access,
        user: AppState.getUser() || {id: 'mock-user', name: 'Test User', email: 'test@example.com'}
      };
    }
    
    // INSIGHTS ENDPOINTS
    if(path.startsWith('/insights/summary')){
      return {
        total_spend: 3920.50,
        avg_order_value: 245.60,
        total_orders: 16,
        by_category: [
          {key:'dairy', total:870, count: 8},
          {key:'snacks', total:640, count: 12},
          {key:'beverages', total:450, count: 6},
          {key:'produce', total:320, count: 5}
        ],
        budget: {set:4000, spent:3920.50, remaining:79.50, percent:98}
      };
    }
    
    if(path.startsWith('/insights/heatmap')){
      // Generate realistic-looking heatmap data
      const matrix = Array.from({length:7}, (_, day) => 
        Array.from({length:24}, (_, hour) => {
          // More activity during daytime and weekends
          let base = 0;
          if (hour >= 8 && hour <= 20) base = 100; // Daytime base
          if (day >= 5) base += 50; // Weekend boost
          if (hour >= 17 && hour <= 19) base += 80; // Evening peak
          if (hour >= 12 && hour <= 14) base += 60; // Lunch peak
          
          return Math.round(base + (Math.random() * 200));
        })
      );
      const flatMatrix = matrix.flat();
      return {
        matrix: matrix,
        max: Math.max(...flatMatrix),
        min: Math.min(...flatMatrix),
        average: Math.round(flatMatrix.reduce((a, b) => a + b, 0) / flatMatrix.length)
      };
    }
    
    if(path.startsWith('/insights/trends')){
      return {
        monthly_spend: [
          {month: 'Jan', spend: 3200},
          {month: 'Feb', spend: 2850},
          {month: 'Mar', spend: 3920},
          {month: 'Apr', spend: 4100}
        ],
        category_trends: [
          {category: 'dairy', trend: 'up', change: 15},
          {category: 'snacks', trend: 'down', change: -8},
          {category: 'beverages', trend: 'up', change: 22}
        ]
      };
    }
    
    // PURCHASES ENDPOINTS
    if(path.startsWith('/purchases/upload-csv')){
      const body = opts.body;
      console.log('MOCK: CSV upload with', body ? 'form data' : 'no data');
      
      // Simulate processing delay
      await new Promise(r=>setTimeout(r, 1000));
      
      return {
        message: 'File processed successfully',
        inserted: Math.floor(Math.random() * 20) + 5,
        skipped: Math.floor(Math.random() * 3),
        errors: [],
        summary: {
          total_amount: 2450.75,
          date_range: {
            start: '2024-01-01',
            end: '2024-01-15'
          }
        }
      };
    }
    
    if(path.startsWith('/purchases/list')){
      const mockPurchases = [
        {id: 1, date: '2024-01-15', amount: 156.75, category: 'groceries', description: 'Weekly grocery shopping'},
        {id: 2, date: '2024-01-14', amount: 45.50, category: 'dining', description: 'Dinner out'},
        {id: 3, date: '2024-01-13', amount: 89.99, category: 'electronics', description: 'Phone accessory'},
        {id: 4, date: '2024-01-12', amount: 23.45, category: 'groceries', description: 'Quick market run'},
        {id: 5, date: '2024-01-11', amount: 156.75, category: 'utilities', description: 'Electricity bill'}
      ];
      
      return {
        purchases: mockPurchases,
        total: mockPurchases.length,
        page: 1,
        page_size: 10
      };
    }
    
    // SETTINGS ENDPOINTS
    if(path.startsWith('/settings/profile')){
      if(opts.method === 'GET') {
        return {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          budget_limit: 4000,
          notifications: {
            email: true,
            push: false,
            budget_alerts: true
          }
        };
      } else if(opts.method === 'PUT') {
        const body = JSON.parse(opts.body || '{}');
        return {
          message: 'Settings updated successfully',
          settings: body
        };
      }
    }
    
    // Default response for unknown endpoints
    console.warn('MOCK: Unknown endpoint', path);
    return {
      message: 'Mock response - endpoint not specifically handled',
      path: path,
      method: opts.method || 'GET'
    };
  }
})();

// Initialize logging
console.log('API module loaded:', {
  BASE_URL: window.API_BASE_URL,
  USE_MOCK: window.USE_MOCK,
  api: typeof api
});