// state.js - Ensure this works
console.log('=== STATE.JS LOADING ===');

window.AppState = (function() {
    const TOKEN_KEY = 'qcm_tokens';
    const USER_KEY = 'qcm_user';
    
    function setTokens(tokens) {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    }
    
    function getTokens() {
        try {
            return JSON.parse(localStorage.getItem(TOKEN_KEY));
        } catch (e) {
            return null;
        }
    }
    
    function setUser(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    
    function getUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY));
        } catch (e) {
            return null;
        }
    }
    
    function clearTokens() {
        localStorage.removeItem(TOKEN_KEY);
    }
    
    function clearUser() {
        localStorage.removeItem(USER_KEY);
    }
    
    function logout() {
        clearTokens();
        clearUser();
        if (typeof window.showView === 'function') {
            window.showView('login');
        }
    }
    
    return {
        setTokens,
        getTokens,
        setUser,
        getUser,
        clearTokens,
        clearUser,
        logout
    };
})();

console.log('=== STATE.JS LOADED ===');