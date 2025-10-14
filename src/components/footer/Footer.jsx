.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.headerContent {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

.logo a {
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1002;
}

.logo a:hover {
  color: #f0f4ff;
  transform: translateY(-1px);
}

/* Navigation */
.nav {
  display: flex;
  gap: 2.5rem;
  align-items: center;
}

.navLink {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.5rem 0;
  position: relative;
  font-size: 1.1rem;
  white-space: nowrap;
}

.navLink:hover {
  color: white;
  transform: translateY(-1px);
}

.navLink::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: white;
  transition: width 0.3s ease;
}

.navLink:hover::after {
  width: 100%;
}

/* User Controls */
.userControls {
  display: flex;
  gap: 1rem;
  align-items: center;
  position: relative;
}

/* Auth Buttons */
.authButton {
  padding: 0.7rem 1.8rem;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  font-size: 1rem;
  white-space: nowrap;
}

.authButton:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logoutButton {
  padding: 0.7rem 1.8rem;
  background: rgba(239, 68, 68, 0.2);
  color: white;
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  font-size: 1rem;
  white-space: nowrap;
}

.logoutButton:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* Language Styles */
.languageContainer {
  position: relative;
}

.languageButton {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: none;
  padding: 8px;
  border-radius: 6px;
}

.languageButton:hover {
  background: rgba(255, 255, 255, 0.1);
}

.languageIcon {
  width: 20px;
  height: 20px;
}

.languageDropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.95);
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  min-width: 140px;
  z-index: 1001;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.languageOption {
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: white;
  font-weight: 500;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.languageOption:last-child {
  border-bottom: none;
}

.languageOption:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Active Navigation */
.navLinkActive {
  color: white !important;
}

.navLinkActive::after {
  width: 100% !important;
}

/* Mobile Menu Button */
.mobileMenuButton {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  z-index: 1002;
}

.mobileMenuButton:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Mobile Auth Section */
.mobileAuthSection {
  display: none;
}

/* Overlay */
.overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* ========== MOBILE STYLES ========== */
@media (max-width: 968px) {
  .headerContent {
    padding: 1rem 1.5rem;
  }
  
  .nav {
    gap: 2rem;
  }
  
  .navLink {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .mobileMenuButton {
    display: block;
  }
  
  .nav {
    position: fixed;
    top: 0;
    right: -100%;
    width: 280px;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 80px 2rem 2rem;
    gap: 0;
    transition: right 0.3s ease;
    box-shadow: -5px 0 25px rgba(0, 0, 0, 0.3);
    z-index: 1001;
  }
  
  .navOpen {
    right: 0;
  }
  
  .navLink {
    width: 100%;
    padding: 1rem 0;
    font-size: 1.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .navLink:last-child {
    border-bottom: none;
  }
  
  .navLink::after {
    display: none;
  }
  
  .userControls {
    display: none;
  }
  
  .mobileAuthSection {
    display: block;
    width: 100%;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .mobileAuthSection .authButton,
  .mobileAuthSection .logoutButton {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
  }
  
  .overlay {
    display: block;
  }
  
  .logo a {
    font-size: 1.6rem;
  }
}

@media (max-width: 480px) {
  .headerContent {
    padding: 0.8rem 1rem;
  }
  
  .nav {
    width: 100%;
    right: -100%;
  }
  
  .navOpen {
    right: 0;
  }
  
  .logo a {
    font-size: 1.4rem;
  }
  
  .mobileMenuButton {
    font-size: 1.3rem;
    padding: 6px;
  }
}

@media (max-width: 360px) {
  .headerContent {
    padding: 0.6rem 0.8rem;
  }
  
  .nav {
    padding: 70px 1.5rem 1.5rem;
  }
  
  .navLink {
    font-size: 1rem;
    padding: 0.8rem 0;
  }
  
  .logo a {
    font-size: 1.3rem;
  }
}

/* Touch device improvements */
@media (hover: none) and (pointer: coarse) {
  .navLink:hover {
    transform: none;
  }
  
  .authButton:hover,
  .logoutButton:hover {
    transform: none;
  }
  
  .languageButton:hover {
    background: transparent;
  }
}