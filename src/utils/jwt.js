// Utility function to decode JWT token (without verification - client side only)
export const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

// Check if token is expired
export const isTokenExpired = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
};
