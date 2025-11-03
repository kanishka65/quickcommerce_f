// auth.js - Updated with better error handling
console.log('=== AUTH.JS LOADING ===');

function showView(viewName) {
    console.log('showView called with:', viewName);
    
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.add('d-none'));
    
    // Show target view
    const el = document.getElementById(viewName + '-view');
    if(el) {
        el.classList.remove('d-none');
        console.log('Successfully showed view:', viewName);
    }
    
    // Update nav
    const user = AppState.getUser();
    document.getElementById('btnLogout').classList.toggle('d-none', !user);
    document.getElementById('navUser').textContent = user ? (user.name || user.email) : '';
}

window.showView = showView;

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM LOADED - SETUP AUTH ===');
    
    // Register button
    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Register button clicked');
        showView('register');
    });
    
    // Back to login
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Back to login clicked');
        showView('login');
    });
    
    // Logout
    document.getElementById('btnLogout').addEventListener('click', function() {
        console.log('Logout clicked');
        AppState.logout();
    });
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        const btn = e.target.querySelector('button[type="submit"]');
        
        errorDiv.textContent = '';
        btn.disabled = true;
        btn.textContent = 'Logging in...';
        
        try {
            console.log('Calling login API...');
            const result = await api.post('/auth/login', {email, password});
            console.log('Login API response:', result);
            
            // Store user and tokens
            if (result.user) {
                AppState.setUser(result.user);
                console.log('User stored:', result.user);
            }
            if (result.access_token) {
                AppState.setTokens({
                    access: result.access_token,
                    refresh: result.refresh_token
                });
                console.log('Tokens stored');
            }
            
            console.log('Redirecting to dashboard...');
            showView('dashboard');
            
            // Initialize dashboard
            if (window.initDashboard) {
                console.log('Calling initDashboard...');
                window.initDashboard();
            }
        } catch(error) {
            console.error('Login error details:', error);
            errorDiv.textContent = error.error || 'Login failed. Please check your credentials.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    });
    
    // Register form - UPDATED WITH BETTER ERROR HANDLING
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Register form submitted');
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorDiv = document.getElementById('register-error');
        const btn = e.target.querySelector('button[type="submit"]');
        
        errorDiv.textContent = '';
        btn.disabled = true;
        btn.textContent = 'Creating Account...';
        
        try {
            console.log('Calling register API with:', { name, email, password });
            const result = await api.post('/auth/register', {name, email, password});
            console.log('Register API response:', result);
            
            // Store user and tokens
            if (result.user) {
                AppState.setUser(result.user);
                console.log('User stored after registration:', result.user);
            }
            if (result.access_token) {
                AppState.setTokens({
                    access: result.access_token,
                    refresh: result.refresh_token
                });
                console.log('Tokens stored after registration');
            }
            
            // Verify storage worked
            const storedUser = AppState.getUser();
            const storedTokens = AppState.getTokens();
            console.log('Verification - Stored user:', storedUser);
            console.log('Verification - Stored tokens:', storedTokens);
            
            if (storedUser && storedTokens) {
                console.log('Registration successful, redirecting to dashboard...');
                showView('dashboard');
                
                // Initialize dashboard
                if (window.initDashboard) {
                    console.log('Calling initDashboard after registration...');
                    window.initDashboard();
                }
            } else {
                console.error('Storage verification failed!');
                errorDiv.textContent = 'Registration completed but login failed. Please try logging in.';
                showView('login');
            }
            
            // Clear form
            document.getElementById('register-form').reset();
            
        } catch(error) {
            console.error('Registration error details:', error);
            // Show detailed error message
            if (error.error) {
                errorDiv.textContent = error.error;
            } else if (error.status === 500) {
                errorDiv.textContent = 'Server error. Please try again later.';
            } else {
                errorDiv.textContent = 'Registration failed. Please try again.';
            }
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    });
    
    // Sidebar navigation
    document.querySelectorAll('.link-view').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            console.log('Sidebar link clicked:', view);
            
            if (view === 'dashboard' && !AppState.getUser()) {
                showView('login');
                return;
            }
            
            showView(view);
        });
    });
    
    // Initial view setup
    const currentUser = AppState.getUser();
    const currentTokens = AppState.getTokens();
    console.log('Current user on load:', currentUser);
    console.log('Current tokens on load:', currentTokens);
    
    if (currentUser && currentTokens) {
        console.log('User already logged in, showing dashboard');
        showView('dashboard');
        if (window.initDashboard) {
            setTimeout(() => {
                window.initDashboard();
            }, 100);
        }
    } else {
        console.log('No user or tokens, showing login');
        showView('login');
    }
    
    console.log('=== AUTH INITIALIZATION COMPLETE ===');
});

console.log('=== AUTH.JS LOADED (waiting for DOM) ===');