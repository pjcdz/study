// filepath: /root/manu-simplechatapp/frontend/src/features/auth/components/AuthModal.jsx
import React, { useEffect, useState } from "react";
import { auth, provider } from "../config/config";
import { signInWithPopup } from "firebase/auth";
import { THEME_COLORS } from "../../../shared/utils/themeUtils";

/**
 * Authentication modal component for Google sign-in
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onAuthSuccess - Function called on successful authentication
 */
function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [user, setUser] = useState(null);
  
  // Check for stored user on component mount
  useEffect(() => {
    const storedName = localStorage.getItem("name");
    const storedEmail = localStorage.getItem("email");
    const storedPhoto = localStorage.getItem("photo");
    
    if (storedName && storedEmail) {
      setUser({
        displayName: storedName,
        email: storedEmail,
        photoURL: storedPhoto
      });
    }
  }, []);

  // Handle Google sign-in
  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const userData = result.user;
        setUser(userData);
        
        // Store user information in localStorage
        localStorage.setItem("name", userData.displayName);
        localStorage.setItem("email", userData.email);
        localStorage.setItem("photo", userData.photoURL);
        
        // Notify parent component of successful authentication
        if (onAuthSuccess) {
          onAuthSuccess(userData);
        }
      })
      .catch((error) => {
        console.error("Authentication error:", error);
      });
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("photo");
    setUser(null);
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal container */}
      <div 
        className="relative bg-opacity-95 rounded-lg shadow-xl w-full max-w-md p-6 overflow-hidden"
        style={{ 
          backgroundColor: THEME_COLORS.background,
          border: `1px solid ${THEME_COLORS.border}`,
          boxShadow: `0 0 20px 0 ${THEME_COLORS.glow}`
        }}
      >
        {/* Close button */}
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        {/* Modal header */}
        <div className="text-center mb-6">
          <h3 
            className="text-xl font-medium" 
            style={{ color: THEME_COLORS.primary }}
          >
            Sign In
          </h3>
        </div>
        
        {/* Modal content */}
        <div className="space-y-6">
          {user ? (
            // Authenticated user view
            <div className="text-center space-y-4">
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full mx-auto"
                />
              )}
              <div style={{ color: THEME_COLORS.text }}>
                <p className="text-lg font-semibold">{user.displayName}</p>
                <p className="text-sm opacity-70">{user.email}</p>
              </div>
              
              <button
                className="w-full py-2.5 rounded-md font-medium text-sm transition-colors duration-200"
                style={{ 
                  backgroundColor: THEME_COLORS.button.danger, 
                  color: "#FFFFFF"
                }}
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          ) : (
            // Unauthenticated user view
            <div className="text-center space-y-6">
              <p style={{ color: THEME_COLORS.textDimmed }}>
                Sign in to access all features of the Study Tool
              </p>
              
              <button
                className="w-full py-2.5 rounded-md font-medium text-sm flex items-center justify-center space-x-2 transition-colors duration-200"
                style={{ 
                  backgroundColor: "#FFFFFF", 
                  color: "#202124"
                }}
                onClick={handleGoogleSignIn}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;