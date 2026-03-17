import { Link, useLocation } from 'react-router';
import logoImage from 'figma:asset/81a3f660f5bff86aa9750482c0eda7c4835e704a.png';

export default function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-[#0f172a] border-b-2 border-[#1e293b] sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logoImage} alt="Vibe House" className="h-8 md:h-10 w-auto" />
          </Link>
          <div className="hidden md:flex gap-6">
            <Link 
              to="/" 
              className={`font-['Space_Grotesk'] text-[14px] transition-colors ${
                isActive('/') ? 'text-[#ff2e62]' : 'text-white hover:text-[#ff2e62]'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/rooms" 
              className={`font-['Space_Grotesk'] text-[14px] transition-colors ${
                isActive('/rooms') ? 'text-[#ff2e62]' : 'text-white hover:text-[#ff2e62]'
              }`}
            >
              Rooms
            </Link>
            <Link 
              to="/events" 
              className={`font-['Space_Grotesk'] text-[14px] transition-colors ${
                isActive('/events') ? 'text-[#ff2e62]' : 'text-white hover:text-[#ff2e62]'
              }`}
            >
              Events
            </Link>
            <Link 
              to="/about" 
              className={`font-['Space_Grotesk'] text-[14px] transition-colors ${
                isActive('/about') ? 'text-[#ff2e62]' : 'text-white hover:text-[#ff2e62]'
              }`}
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
