import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Calendar, Users, ArrowRight, Star, Wifi, Coffee, Lock, Zap, Wind, Utensils, Droplet, MapPin, CheckCircle2, Shield, Snowflake, Clock, Package, Instagram } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

export default function LandingPage() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  return (
    <div className="bg-[#230f14] min-h-screen w-full">
      {/* Navigation Bar */}
      <nav className="bg-[#0f172a] border-b-2 border-[#1e293b] sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="font-['Space_Grotesk'] font-bold text-[20px] text-[#ff2e62] uppercase tracking-[2px]">
              Vibe House
            </Link>
            <div className="flex gap-6">
              <Link to="/" className="font-['Space_Grotesk'] text-[14px] text-[#ff2e62]">
                Home
              </Link>
              <Link to="/rooms" className="font-['Space_Grotesk'] text-[14px] text-white hover:text-[#ff2e62] transition-colors">
                Rooms
              </Link>
              <Link to="/events" className="font-['Space_Grotesk'] text-[14px] text-white hover:text-[#ff2e62] transition-colors">
                Events
              </Link>
              <Link to="/about" className="font-['Space_Grotesk'] text-[14px] text-white hover:text-[#ff2e62] transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute right-[-40px] top-1/4 bottom-[43.78%] opacity-20 w-[85.333px] h-[101.333px]">
          <svg className="w-full h-full" fill="none" viewBox="0 0 85.3333 101.333">
            <path d="M42.6667 0L85.3333 24.5833V75.75L42.6667 101.333L0 75.75V24.5833L42.6667 0Z" fill="#FF2E62" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center px-6 pt-12 pb-16">
          {/* Street Art Badge */}
          <div className="bg-[#ff2e62] px-3 py-1 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] mb-8">
            <p className="font-['Space_Grotesk'] font-bold text-[12px] text-white text-center tracking-[1.2px] uppercase leading-[16px]">
              Street Art Inspired
            </p>
          </div>

          {/* Main Tagline */}
          <div className="max-w-[896px] px-[61.16px] mb-12">
            <h1 className="font-['Space_Grotesk'] font-bold text-[60px] text-[#f1f5f9] text-center tracking-[-3px] uppercase leading-[51px]">
              <span>STAY </span>
              <span className="text-[#ff2e62]">MIX</span>
              <br />
              <span>REPEAT</span>
            </h1>
          </div>

          {/* Booking Widget */}
          <div className="bg-white p-6 rounded-[8px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] max-w-[380px] w-full border-2 border-[#ff2e62]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-['Space_Grotesk'] font-bold text-[10px] text-[#0f172a] uppercase tracking-[1px] mb-2 block">
                    Check-In
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#cbd5e1] rounded-[4px] font-['Space_Grotesk'] text-[14px] focus:border-[#ff2e62] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-['Space_Grotesk'] font-bold text-[10px] text-[#0f172a] uppercase tracking-[1px] mb-2 block">
                    Check-Out
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#cbd5e1] rounded-[4px] font-['Space_Grotesk'] text-[14px] focus:border-[#ff2e62] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="font-['Space_Grotesk'] font-bold text-[10px] text-[#0f172a] uppercase tracking-[1px] mb-2 block">
                  Guests
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-10 h-10 rounded-[4px] border-2 border-[#cbd5e1] font-['Space_Grotesk'] font-bold text-[18px] text-[#0f172a] hover:border-[#ff2e62] transition-colors"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center font-['Space_Grotesk'] font-bold text-[18px] text-[#0f172a]">
                    {guests}
                  </div>
                  <button
                    onClick={() => setGuests(guests + 1)}
                    className="w-10 h-10 rounded-[4px] border-2 border-[#cbd5e1] font-['Space_Grotesk'] font-bold text-[18px] text-[#0f172a] hover:border-[#ff2e62] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <button className="w-full bg-[#ff2e62] px-10 py-4 rounded-[2px] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] transition-all">
                <span className="font-['Space_Grotesk'] font-bold text-[18px] text-white uppercase leading-[28px]">
                  Check Availability
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Assurances Grid */}
      <section className="px-6 py-16">
        <h2 className="font-['Space_Grotesk'] font-bold text-[30px] text-white tracking-[-1.5px] uppercase leading-[36px] text-center mb-3">
          Stay With Confidence
        </h2>
        <p className="font-['Liberation_Serif'] text-[14px] text-[rgba(255,255,255,0.8)] text-center mb-10 italic">
          your safety is our priority
        </p>
        
        <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto">
          {[
            { icon: <Droplet className="w-8 h-8" />, label: 'Clean Rooms', color: '#00d1ff' },
            { icon: <Shield className="w-8 h-8" />, label: 'Safe & Secure', color: '#ff2e62' },
            { icon: <Snowflake className="w-8 h-8" />, label: 'AC Dorms', color: '#39ff14' },
            { icon: <Clock className="w-8 h-8" />, label: '24/7 Reception', color: '#facc15' },
            { icon: <Lock className="w-8 h-8" />, label: 'Secure Lockers', color: '#ff2e62' },
            { icon: <CheckCircle2 className="w-8 h-8" />, label: '7-Day Cancel', color: '#39ff14' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-[rgba(35,15,20,0.5)] border-2 border-dashed border-[rgba(255,255,255,0.3)] rounded-[4px] p-6 text-center"
              style={{ transform: idx % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)' }}
            >
              <div className="flex justify-center mb-3" style={{ color: item.color }}>
                {item.icon}
              </div>
              <p className="font-['Space_Grotesk'] font-bold text-[14px] text-white uppercase leading-[20px]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Guest Energy (Social Media) */}
      <section className="px-6 py-16">
        <h2 className="font-['Space_Grotesk'] font-bold text-[30px] text-white tracking-[-1.5px] uppercase leading-[36px] text-center mb-3">
          The Energy
        </h2>
        <p className="font-['Liberation_Serif'] text-[14px] text-[rgba(255,255,255,0.8)] text-center mb-10 italic">
          see what's happening
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto mb-8">
          <div className="aspect-square rounded-[4px] overflow-hidden border-4 border-white shadow-[8px_8px_0px_0px_#ff2e62]" style={{ transform: 'rotate(-2deg)' }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1681747971522-2d7a04c78321?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNrcGFja2VycyUyMGxhdWdoaW5nJTIwdG9nZXRoZXIlMjBob3N0ZWx8ZW58MXx8fHwxNzczNzI0Njc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Guests having fun"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-square rounded-[4px] overflow-hidden border-4 border-white shadow-[8px_8px_0px_0px_#00d1ff]" style={{ transform: 'rotate(2deg)' }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1710144994421-a41e387e71c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHRyYXZlbGVycyUyMGdhbWUlMjBuaWdodHxlbnwxfHx8fDE3NzM3MjQ2NzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Game night"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-square rounded-[4px] overflow-hidden border-4 border-white shadow-[8px_8px_0px_0px_#39ff14]" style={{ transform: 'rotate(1deg)' }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1766113491996-19167a988455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRzJTIwdG9hc3RpbmclMjBkcmlua3MlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NzM3MjQ2ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Celebration"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-square rounded-[4px] overflow-hidden border-4 border-white shadow-[8px_8px_0px_0px_#facc15]" style={{ transform: 'rotate(-1.5deg)' }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1647649644192-af6183269fa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3N0ZWwlMjBwYXJ0eSUyMG5pZ2h0bGlmZXxlbnwxfHx8fDE3NzM3MjQ2NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Party night"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button className="bg-gradient-to-r from-[#ff2e62] to-[#ff6b98] px-8 py-4 rounded-[12px] border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] flex items-center gap-3 hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] transition-all">
            <Instagram className="w-6 h-6 text-white" />
            <span className="font-['Space_Grotesk'] font-bold text-[18px] text-white uppercase">
              @VibeHouse
            </span>
          </button>
        </div>
      </section>

      {/* Tonight at Vibe House */}
      <section className="px-6 py-16">
        <h2 className="font-['Space_Grotesk'] font-bold text-[30px] text-white tracking-[-1.5px] uppercase leading-[36px] text-center mb-3">
          Tonight at Vibe House
        </h2>
        <p className="font-['Liberation_Serif'] text-[14px] text-[rgba(255,255,255,0.8)] text-center mb-10 italic">
          next 48 hours
        </p>

        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide max-w-[400px] mx-auto">
          {[
            { title: 'Pub Crawl', time: 'Tonight 9PM', location: 'Meet at Lobby', color: '#ff2e62', badge: 'Popular' },
            { title: 'Game Night', time: 'Today 7PM', location: 'Common Area', color: '#00d1ff', badge: 'Free' },
            { title: 'Local Music', time: 'Tomorrow 8PM', location: 'Rooftop', color: '#39ff14', badge: 'Live' },
          ].map((event, idx) => (
            <div
              key={idx}
              className="min-w-[280px] snap-start bg-[#1e293b] border-2 border-[rgba(255,255,255,0.2)] rounded-[8px] p-6 relative"
              style={{ transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)` }}
            >
              {event.badge && (
                <div
                  className="absolute top-[-12px] right-[-8px] px-3 py-1 rounded-[12px] border-2 border-[#0f172a] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: event.color, transform: 'rotate(12deg)' }}
                >
                  <span className="font-['Space_Grotesk'] font-bold text-[10px] text-white uppercase">
                    {event.badge}
                  </span>
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-['Space_Grotesk'] font-bold text-[24px] text-white uppercase leading-[32px] mb-2">
                  {event.title}
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)]">
                    <Clock className="w-4 h-4" />
                    <span className="font-['Space_Grotesk'] text-[12px]">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)]">
                    <MapPin className="w-4 h-4" />
                    <span className="font-['Space_Grotesk'] text-[12px]">{event.location}</span>
                  </div>
                </div>
              </div>
              <button
                className="w-full px-4 py-2 rounded-[4px] border-2 border-[rgba(255,255,255,0.3)] font-['Space_Grotesk'] font-bold text-[14px] text-white uppercase hover:border-white transition-colors"
                style={{ backgroundColor: `${event.color}40` }}
              >
                RSVP Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Rooms Overview */}
      <section className="px-6 py-16">
        <h2 className="font-['Space_Grotesk'] font-bold text-[30px] text-white tracking-[-1.5px] uppercase leading-[36px] text-center mb-3">
          Rooms
        </h2>
        <p className="font-['Liberation_Serif'] text-[14px] text-[rgba(255,255,255,0.8)] text-center mb-10 italic">
          find your corner
        </p>

        <div className="space-y-6 max-w-[400px] mx-auto">
          {[
            {
              title: '4-Bed Mixed Dorm',
              price: '₹599',
              capacity: '4 Guests',
              image: 'https://images.unsplash.com/photo-1694151569569-8288e3118519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3N0ZWwlMjBkb3JtJTIwcm9vbSUyMGNsZWFufGVufDF8fHx8MTc3MzcyNDY3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
              badge: 'Most Popular',
              badgeColor: '#ff2e62'
            },
            {
              title: '6-Bed Female Dorm',
              price: '₹499',
              capacity: '6 Guests',
              image: 'https://images.unsplash.com/photo-1549881567-c622c1080d78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb3JtJTIwYnVuayUyMGJlZCUyMGhvc3RlbHxlbnwxfHx8fDE3NzM3MjQ2ODN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
              badge: 'Safe Space',
              badgeColor: '#39ff14'
            },
            {
              title: 'Private Room',
              price: '₹1,299',
              capacity: '2 Guests',
              image: 'https://images.unsplash.com/photo-1760067538068-03d10481bacb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwaG9zdGVsJTIwcm9vbSUyMG1vZGVybnxlbnwxfHx8fDE3NzM3MjQ2NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
              badge: 'Privacy',
              badgeColor: '#00d1ff'
            },
          ].map((room, idx) => (
            <div
              key={idx}
              className="bg-[#1e293b] border-2 border-[#334155] rounded-[8px] overflow-hidden shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] relative"
              style={{ transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)` }}
            >
              {room.badge && (
                <div
                  className="absolute top-3 left-3 z-10 px-3 py-1 rounded-[2px] border-2 border-[#0f172a]"
                  style={{ backgroundColor: room.badgeColor }}
                >
                  <span className="font-['Space_Grotesk'] font-bold text-[10px] text-white uppercase">
                    {room.badge}
                  </span>
                </div>
              )}
              <div className="h-[200px] overflow-hidden">
                <ImageWithFallback
                  src={room.image}
                  alt={room.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="font-['Space_Grotesk'] font-bold text-[20px] text-white leading-[25px] mb-2">
                  {room.title}
                </h3>
                <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)] mb-4">
                  <Users className="w-4 h-4" />
                  <span className="font-['Space_Grotesk'] text-[14px]">{room.capacity}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-['Space_Grotesk'] text-[12px] text-[rgba(255,255,255,0.6)] uppercase mb-1">
                      Starting from
                    </p>
                    <p className="font-['Space_Grotesk'] font-bold text-[24px] text-[#ff2e62]">
                      {room.price}
                    </p>
                  </div>
                  <button className="bg-[rgba(255,255,255,0.1)] border-2 border-[rgba(255,255,255,0.3)] px-5 py-2 rounded-[4px] font-['Space_Grotesk'] font-bold text-[14px] text-white uppercase hover:bg-[rgba(255,255,255,0.2)] transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The Vibe House Experience */}
      <section className="px-6 py-16">
        <h2 className="font-['Space_Grotesk'] font-bold text-[30px] text-white tracking-[-1.5px] uppercase leading-[36px] text-center mb-3">
          The Vibe House Experience
        </h2>
        <p className="font-['Liberation_Serif'] text-[14px] text-[rgba(255,255,255,0.8)] text-center mb-10 italic">
          why travelers choose us
        </p>

        <div className="max-w-[400px] mx-auto space-y-8">
          {/* High Energy Community */}
          <div className="bg-gradient-to-br from-[#ff2e62] to-[#ff6b98] p-6 rounded-[8px] border-2 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]" style={{ transform: 'rotate(-1deg)' }}>
            <div className="bg-[rgba(255,255,255,0.2)] backdrop-blur-sm rounded-[4px] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white rounded-full p-2">
                  <Zap className="w-6 h-6 text-[#ff2e62]" />
                </div>
                <h3 className="font-['Space_Grotesk'] font-bold text-[20px] text-white uppercase">
                  High Energy
                </h3>
              </div>
              <p className="font-['Space_Grotesk'] text-[14px] text-white leading-[20px]">
                Daily events, pub crawls, and game nights keep the energy alive. Meet travelers from around the world and create memories that last forever.
              </p>
            </div>
          </div>

          {/* Safety First */}
          <div className="bg-gradient-to-br from-[#39ff14] to-[#6fff47] p-6 rounded-[8px] border-2 border-[#0f172a] shadow-[8px_8px_0px_0px_rgba(15,23,42,0.3)]" style={{ transform: 'rotate(1deg)' }}>
            <div className="bg-[rgba(0,0,0,0.1)] backdrop-blur-sm rounded-[4px] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#0f172a] rounded-full p-2">
                  <Shield className="w-6 h-6 text-[#39ff14]" />
                </div>
                <h3 className="font-['Space_Grotesk'] font-bold text-[20px] text-[#0f172a] uppercase">
                  Safety First
                </h3>
              </div>
              <p className="font-['Space_Grotesk'] text-[14px] text-[#0f172a] leading-[20px]">
                24/7 security, CCTV coverage, secure lockers, and verified staff ensure your peace of mind. Clean facilities sanitized daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Carousel */}
      <section className="px-6 py-16">
        <h2 className="font-['Space_Grotesk'] font-bold text-[30px] text-white tracking-[-1.5px] uppercase leading-[36px] text-center mb-3">
          Amenities
        </h2>
        <p className="font-['Liberation_Serif'] text-[14px] text-[rgba(255,255,255,0.8)] text-center mb-10 italic">
          everything you need
        </p>

        <div className="flex flex-wrap gap-3 justify-center max-w-[400px] mx-auto">
          {[
            { icon: <Wifi className="w-5 h-5" />, label: 'Fast Wi-Fi', color: '#00d1ff' },
            { icon: <Droplet className="w-5 h-5" />, label: 'Hot Showers', color: '#ff2e62' },
            { icon: <Coffee className="w-5 h-5" />, label: 'Café', color: '#facc15' },
            { icon: <Package className="w-5 h-5" />, label: 'Laundry', color: '#39ff14' },
            { icon: <Wind className="w-5 h-5" />, label: 'AC', color: '#00d1ff' },
            { icon: <Utensils className="w-5 h-5" />, label: 'Kitchen', color: '#ff2e62' },
            { icon: <MapPin className="w-5 h-5" />, label: 'Central Location', color: '#facc15' },
            { icon: <Lock className="w-5 h-5" />, label: 'Lockers', color: '#39ff14' },
          ].map((amenity, idx) => (
            <div
              key={idx}
              className="bg-[rgba(255,255,255,0.1)] border-2 border-[rgba(255,255,255,0.3)] rounded-[12px] px-5 py-3 flex items-center gap-2 hover:border-white transition-colors"
              style={{ transform: `rotate(${(idx % 3 - 1) * 2}deg)` }}
            >
              <div style={{ color: amenity.color }}>{amenity.icon}</div>
              <span className="font-['Space_Grotesk'] font-bold text-[12px] text-white uppercase">
                {amenity.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof (Reviews) */}
      <section className="px-6 py-16">
        <h2 className="font-['Space_Grotesk'] font-bold text-[30px] text-white tracking-[-1.5px] uppercase leading-[36px] text-center mb-3">
          Guest Stories
        </h2>
        <p className="font-['Liberation_Serif'] text-[14px] text-[rgba(255,255,255,0.8)] text-center mb-10 italic">
          what travelers say
        </p>

        <div className="space-y-6 max-w-[400px] mx-auto">
          {[
            {
              name: 'Sarah M.',
              country: 'Australia',
              rating: 5,
              review: 'Best hostel experience ever! The staff was amazing and I met so many cool people. The cleanliness is top-notch!',
              avatar: 'https://images.unsplash.com/photo-1622646771382-1c9c090d3c37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHRyYXZlbGVyJTIwcG9ydHJhaXQlMjB5b3VuZ3xlbnwxfHx8fDE3NzM3MjQ2Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
            },
            {
              name: 'Marco R.',
              country: 'Italy',
              rating: 5,
              review: 'The events were incredible! Pub crawl was so much fun. Great vibes, great people, great location.',
              avatar: null
            },
            {
              name: 'Yuki T.',
              country: 'Japan',
              rating: 5,
              review: 'Felt safe the entire stay. Female dorms are perfect. WiFi is super fast for remote work. Will come back!',
              avatar: null
            },
          ].map((review, idx) => (
            <div
              key={idx}
              className="bg-[#1e293b] border-2 border-[#334155] rounded-[8px] p-6 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
              style={{ transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#334155] flex items-center justify-center">
                  {review.avatar ? (
                    <ImageWithFallback
                      src={review.avatar}
                      alt={review.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-['Space_Grotesk'] font-bold text-[20px] text-white">
                      {review.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-['Space_Grotesk'] font-bold text-[16px] text-white">
                    {review.name}
                  </p>
                  <p className="font-['Space_Grotesk'] text-[12px] text-[rgba(255,255,255,0.6)]">
                    {review.country}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#facc15] text-[#facc15]" />
                  ))}
                </div>
              </div>
              <p className="font-['Space_Grotesk'] text-[14px] text-[rgba(255,255,255,0.9)] leading-[20px] italic">
                "{review.review}"
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 mb-8">
        <div className="bg-gradient-to-br from-[#ff2e62] via-[#ff6b98] to-[#ff2e62] p-8 rounded-[12px] border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.3)] max-w-[400px] mx-auto" style={{ transform: 'rotate(-1deg)' }}>
          <h2 className="font-['Space_Grotesk'] font-bold text-[36px] text-white tracking-[-1.8px] uppercase leading-[40px] text-center mb-4">
            Your Adventure Starts Here
          </h2>
          <p className="font-['Liberation_Serif'] text-[16px] text-white text-center mb-8 italic">
            Join the community. Book your stay.
          </p>

          {/* Simplified Booking Widget */}
          <div className="bg-white p-5 rounded-[8px] mb-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                type="date"
                className="px-3 py-2 border-2 border-[#cbd5e1] rounded-[4px] font-['Space_Grotesk'] text-[14px] focus:border-[#ff2e62] focus:outline-none"
              />
              <input
                type="date"
                className="px-3 py-2 border-2 border-[#cbd5e1] rounded-[4px] font-['Space_Grotesk'] text-[14px] focus:border-[#ff2e62] focus:outline-none"
              />
            </div>
            <button className="w-full bg-[#ff2e62] px-8 py-4 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] transition-all">
              <span className="font-['Space_Grotesk'] font-bold text-[18px] text-white uppercase leading-[28px] flex items-center justify-center gap-2">
                Book Now
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </div>

          <div className="text-center">
            <p className="font-['Space_Grotesk'] text-[12px] text-white uppercase tracking-[1px]">
              Free Cancellation • No Booking Fees
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t-2 border-[#1e293b] px-6 py-8">
        <div className="max-w-[400px] mx-auto text-center">
          <div className="mb-6">
            <h3 className="font-['Space_Grotesk'] font-bold text-[20px] text-[#ff2e62] uppercase tracking-[2px] mb-2">
              Vibe House
            </h3>
            <p className="font-['Liberation_Serif'] text-[14px] text-[rgba(255,255,255,0.6)] italic">
              Stay. Mix. Repeat.
            </p>
          </div>
          <div className="flex justify-center gap-6 mb-6">
            <Instagram className="w-6 h-6 text-[rgba(255,255,255,0.6)] hover:text-[#ff2e62] transition-colors cursor-pointer" />
            <svg className="w-6 h-6 text-[rgba(255,255,255,0.6)] hover:text-[#00d1ff] transition-colors cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </div>
          <p className="font-['Space_Grotesk'] text-[12px] text-[rgba(255,255,255,0.4)]">
            © 2026 Vibe House. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
