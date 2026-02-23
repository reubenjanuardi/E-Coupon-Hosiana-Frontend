import { useState, useEffect, useRef } from "react";
import { BookOpen, CheckCircle, QrCode, MessageCircle, Youtube, Instagram, Trophy, ChevronDown, ChevronLeft, ChevronRight, Menu, X, Ticket } from "lucide-react";
import motorImage from "../assets/Motor.jpg";
import microwaveImage from "../assets/Microwave.jpg";
import tvImage from "../assets/TV.jpg";
import kulkasImage from "../assets/Kulkas.jpg";
import dispenserImage from "../assets/Dispenser.png";
import heroImage from "../assets/gereja.jpg";
import logoNavbar from "../assets/logo-navbar.png";

// --- Components ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

function Button({ className = "", variant = "primary", size = "md", ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg",
  };

  return <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

interface Prize {
  name: string;
  image: string;
}

const prizes: Prize[] = [
  { name: "Sepeda Motor Honda Beat", image: motorImage },
  { name: "TV 55 inch", image: tvImage },
  { name: "Kulkas 2 pintu", image: kulkasImage },
  { name: "Dispenser", image: dispenserImage },
  { name: "Microwave", image: microwaveImage },
]; //w:800 q:80

function PrizeCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSlidesToShow(3);
      else if (window.innerWidth >= 768) setSlidesToShow(2);
      else setSlidesToShow(1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = prizes.length - slidesToShow;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [slidesToShow, isPaused]);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = prizes.length - slidesToShow;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = prizes.length - slidesToShow;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  return (
    <div
      className="relative px-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 ease-in-out gap-4" style={{ transform: `translateX(-${currentIndex * (100 / slidesToShow)}%)` }}>
          {prizes.map((prize, index) => (
            <div key={index} className="flex-shrink-0 px-2" style={{ width: `${100 / slidesToShow}%` }}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 h-full">
                <div className="aspect-video bg-slate-100 relative">
                  <img src={prize.image} alt={prize.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 text-center">
                  <h4 className="font-semibold text-slate-800">{prize.name}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 transition-colors z-10">
        <ChevronLeft className="size-6 text-slate-600" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 transition-colors z-10"
      >
        <ChevronRight className="size-6 text-slate-600" />
      </button>
    </div>
  );
}

interface StepCardProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function StepCard({ number, icon, title, description }: StepCardProps) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors shadow-sm">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 size-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">{number}</div>
      <div className="flex justify-center mb-3 mt-2 text-blue-600">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-slate-800">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  );
}

// --- Main Page ---

interface LandingPageProps {
  onOrder?: () => void;
  onVerify?: () => void;
  onAdmin?: () => void;
}

export default function LandingPage({ onOrder, onVerify, onAdmin }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMenuOpen ? "bg-white/90 backdrop-blur-md shadow-md py-2" : "bg-transparent py-4"}`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="focus:outline-none transition-transform hover:scale-105">
            <img src={logoNavbar} alt="Logo GPIB Hosiana" className="h-14 w-auto md:h-14" />
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection("about")} className={`text-sm font-medium transition-colors ${isScrolled ? "text-slate-600 hover:text-blue-600" : "text-blue-100 hover:text-white"}`}>
              Tentang
            </button>
            <button onClick={() => scrollToSection("how-it-works")} className={`text-sm font-medium transition-colors ${isScrolled ? "text-slate-600 hover:text-blue-600" : "text-blue-100 hover:text-white"}`}>
              Cara Pemesanan
            </button>
            <button onClick={() => scrollToSection("contact")} className={`text-sm font-medium transition-colors ${isScrolled ? "text-slate-600 hover:text-blue-600" : "text-blue-100 hover:text-white"}`}>
              Bantuan
            </button>
            <button onClick={onVerify} className={`text-sm font-medium transition-colors ${isScrolled ? "text-slate-600 hover:text-blue-600" : "text-blue-100 hover:text-white"}`}>
              Verifikasi Kupon
            </button>
            <Button onClick={() => scrollToSection("order")} size="sm" className={isScrolled ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50"}>
              Pesan Sekarang
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className={`size-6 ${isScrolled || isMenuOpen ? "text-slate-800" : "text-white"}`} /> : <Menu className={`size-6 ${isScrolled || isMenuOpen ? "text-slate-800" : "text-white"}`} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
            <button
              onClick={() => {
                scrollToSection("about");
                setIsMenuOpen(false);
              }}
              className="text-left py-2 text-slate-600 font-medium hover:text-blue-600 border-b border-slate-50"
            >
              Tentang
            </button>
            <button
              onClick={() => {
                scrollToSection("how-it-works");
                setIsMenuOpen(false);
              }}
              className="text-left py-2 text-slate-600 font-medium hover:text-blue-600 border-b border-slate-50"
            >
              Cara Pemesanan
            </button>
            <button
              onClick={() => {
                scrollToSection("contact");
                setIsMenuOpen(false);
              }}
              className="text-left py-2 text-slate-600 font-medium hover:text-blue-600 border-b border-slate-50"
            >
              Bantuan
            </button>
            <button
              onClick={() => {
                onVerify?.();
                setIsMenuOpen(false);
              }}
              className="text-left py-2 text-slate-600 font-medium hover:text-blue-600 border-b border-slate-50"
            >
              Verifikasi Kupon
            </button>
            <Button
              onClick={() => {
                scrollToSection("order");
                setIsMenuOpen(false);
              }}
              size="sm"
              className="w-full bg-blue-600 text-white mt-2"
            >
              Pesan Sekarang
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative h-[600px] md:h-[700px] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage} //q:80 w:2073
            alt="GPIB Hosiana Jakarta"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-800/70 to-blue-900/90"></div>
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center justify-center px-4 pt-20">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="mb-6 text-4xl md:text-6xl font-bold text-white drop-shadow-lg">Penjualan E-Kupon GPIB Hosiana Jakarta</h1>
            <p className="text-xl md:text-2xl text-blue-50 max-w-2xl mx-auto mb-8 drop-shadow-md leading-relaxed">
              Dukung program - program gereja dengan membeli buku kupon digital. Setiap buku berisi 10 kupon yang akan diundi pada saat ibadah kenaikan Yesus Kristus.
            </p>
            <Button onClick={() => scrollToSection("order")} size="lg" className="text-blue-700 hover:bg-blue-50 shadow-lg text-lg px-8 py-6 h-auto font-bold">
              Pesan Sekarang
              <ChevronDown className="size-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="size-8 text-white opacity-70" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-16 space-y-20">
        {/* Info Card (About) */}
        <section id="about" className="scroll-mt-24">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="size-8 text-blue-600 flex-shrink-0" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Tentang Buku Kupon</h3>
                <ul className="space-y-3 text-blue-800 text-lg">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1.5">•</span>
                    <span>1 Buku Kupon berisi 10 kupon bernomor berurutan.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1.5">•</span>
                    <span>
                      Contoh: <strong>BUKU-0001</strong> berisi kupon <strong>00001 – 00010</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1.5">•</span>
                    <span>Pembelian dilakukan per buku kupon</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1.5">•</span>
                    <span>Kupon diberikan setelah pembayaran diverifikasi panitia</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 mt-1.5">•</span>
                    <span>Distribusi kupon dilakukan secara digital</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="scroll-mt-24">
          <h2 className="text-3xl font-bold text-center mb-10 text-slate-800">Cara Pemesanan</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <StepCard number="1" icon={<BookOpen className="size-8" />} title="Isi Data" description="Masukkan nama, WhatsApp, dan gereja Anda" />
            <StepCard number="2" icon={<Ticket className="size-8" />} title="Pilih Buku" description="Pilih jumlah buku kupon yang ingin dibeli" />
            <StepCard number="3" icon={<QrCode className="size-8" />} title="Bayar" description="Transfer atau scan QRIS dan upload bukti" />
            <StepCard number="4" icon={<CheckCircle className="size-8" />} title="Terima Kupon" description="Kupon digital dikirim via WhatsApp" />
          </div>
        </section>

        {/* Prize Section */}
        <section className="scroll-mt-24">
          <div className="text-center mb-10">
            <div className="size-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Trophy className="size-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Hadiah Undian</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Berbagai hadiah menarik telah disiapkan, antara lain:</p>
          </div>
          <PrizeCarousel />
          <p className="text-center text-slate-500 mt-8 italic">* Gambar hanya ilustrasi, hadiah sebenarnya dapat berbeda</p>
        </section>

        {/* CTA Section */}
        <section id="order" className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 scroll-mt-24" ref={ctaRef}>
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Siap untuk Mendukung?</h2>
          <Button onClick={onOrder} size="lg" className="mb-6 text-lg px-10 py-6 h-auto shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all">
            Pesan Sekarang
          </Button>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 items-center">
            <button onClick={onVerify} className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Verifikasi Kupon
            </button>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 md:p-10 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="size-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <MessageCircle className="size-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Butuh Bantuan?</h2>
            <p className="text-slate-700 mb-8 text-lg">Hubungi kami untuk informasi lebih lanjut tentang program e-kupon gereja</p>
            <div className="mb-8 bg-white/50 p-6 rounded-xl w-full max-w-xs mx-auto">
              <p className="text-slate-500 text-sm uppercase tracking-wider font-semibold mb-2">Contact Person</p>
              <p className="text-slate-900 text-xl font-bold">Marcelia Soraya</p>
            </div>
            <div>
              <a href="https://wa.me/62081361378317" target="_blank" rel="noopener noreferrer" className="inline-block w-full sm:w-auto">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 shadow-lg border-none !h-auto py-4 w-full sm:w-auto flex items-center justify-center gap-2 whitespace-normal text-center leading-tight">
                  <MessageCircle className="size-6 flex-shrink-0" />
                  <span className="font-bold">Hubungi via WhatsApp</span>
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-white text-xl font-bold mb-4">E-Kupon GPIB Hosiana Jakarta</h3>
          <p className="mb-8 leading-relaxed">
            Jl. Rajawali Selatan V No. 7<br />
            Kel. Gunung Sahari Utara - Kec. Sawah Besar.
            <br />
            Jakarta Pusat - 10720
          </p>

          {/* Social Media Icons */}
          <div className="flex justify-center gap-6 mb-8">
            <a
              href="https://www.youtube.com/c/GPIBHosianaJakarta"
              target="_blank"
              rel="noopener noreferrer"
              className="size-12 bg-slate-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300"
              aria-label="YouTube"
            >
              <Youtube className="size-6 text-white" />
            </a>
            <a
              href="https://www.instagram.com/gpibhosianajkt/"
              target="_blank"
              rel="noopener noreferrer"
              className="size-12 bg-slate-800 hover:bg-pink-600 rounded-full flex items-center justify-center transition-all duration-300"
              aria-label="Instagram"
            >
              <Instagram className="size-6 text-white" />
            </a>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <p className="text-sm text-slate-500">Copyright © 2026 GPIB Hosiana Jakarta</p>
            <p className="text-xs text-slate-600 mt-2">Made by RJ {onAdmin && <button onClick={onAdmin} className="hover:text-slate-400 ml-2"> (Admin)</button>}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
