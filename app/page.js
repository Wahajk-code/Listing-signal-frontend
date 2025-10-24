"use client";

import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

// Button Component
const Button = ({
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ca699]";
  const variants = {
    default: "bg-[#2ca699] text-white hover:bg-[#23917a]",
    secondary: "bg-white text-[#09284b] hover:bg-[#23917a] hover:text-white",
    outline:
      "border border-white text-white hover:bg-[#2ca699] hover:text-white",
  };
  const sizes = {
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const styles = `${baseStyles} ${variants[variant] || variants.default} ${
    sizes[size] || sizes.default
  } ${className}`;

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};

// Card Component
const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    zip: "",
    phone: "",
    timeline: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const handleScroll = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.8s ease-out forwards;
        }
        .bg-hero-image {
          background-image: linear-gradient(
              rgba(9, 40, 75, 0.8),
              rgba(9, 40, 75, 0.8)
            ),
            url("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80");
          background-size: cover;
          background-position: center;
        }
        .bg-trust-image {
          background-image: linear-gradient(
              rgba(9, 40, 75, 0.7),
              rgba(9, 40, 75, 0.7)
            ),
            url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80");
          background-size: cover;
          background-position: center;
        }
      `}</style>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-[#09284b] text-white backdrop-blur supports-[backdrop-filter]:bg-[#09284b]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Listing Signal Logo"
                className="h-14 w-auto"
              />
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#home"
                onClick={(e) => handleScroll(e, "home")}
                className="text-sm text-white hover:text-[#2ca699] transition-colors"
              >
                Home
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleScroll(e, "how-it-works")}
                className="text-sm text-white hover:text-[#2ca699] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#why-us"
                onClick={(e) => handleScroll(e, "why-us")}
                className="text-sm text-white hover:text-[#2ca699] transition-colors"
              >
                Why Us
              </a>
              <Button className="bg-[#2ca699] hover:bg-[#23917a] text-white">
                Get Your Signal Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative bg-hero-image px-4 py-20 sm:py-32 lg:py-40 text-white"
      >
        <div className="mx-auto max-w-7xl flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-center max-w-2xl mb-6 text-balance animate-fadeInUp">
            Unlock Your Home’s Selling Potential
          </h1>
          <p
            className="text-lg sm:text-xl text-center max-w-3xl mb-10 leading-relaxed animate-fadeInUp"
            style={{ animationDelay: "0.2s" }}
          >
            Listing Signal™ combines real-time market data and neighborhood
            insights for smarter selling decisions, far beyond a Zestimate.
          </p>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mb-10">
            {[
              {
                icon: TrendingUp,
                title: "Personalized Value",
                description: "MLS-backed valuation for your home.",
              },
              {
                icon: Zap,
                title: "Market Timing",
                description: "Days to sell and inventory insights.",
              },
              {
                icon: MapPin,
                title: "Neighborhood Pulse",
                description: "Active and pending listings nearby.",
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="border border-gray-200 bg-white/10 backdrop-blur-sm p-6 text-center group hover:shadow-lg hover:border-[#2ca699] transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${0.4 + idx * 0.2}s` }}
              >
                <feature.icon className="h-10 w-10 text-[#2ca699] mx-auto mb-4 group-hover:text-white group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-200">{feature.description}</p>
              </Card>
            ))}
          </div>
          <div
            className="flex flex-col gap-3 sm:flex-row animate-fadeInUp"
            style={{ animationDelay: "1.0s" }}
          >
            <Button
              size="lg"
              className="bg-[#2ca699] text-white border border-[#09284b] hover:bg-white hover:text-[#09284b] transition-all duration-300"
            >
              Get Your Listing Signal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-[#2ca699] hover:text-white"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:py-28 lg:py-32 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#09284b] sm:text-4xl mb-4 animate-fadeInUp">
              What's in Your Signal Report
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto animate-fadeInUp"
              style={{ animationDelay: "0.2s" }}
            >
              Everything you need to understand your home's market position and
              make confident decisions
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Personalized Value Range",
                description: "MLS-backed valuation with real-time market data",
              },
              {
                icon: Zap,
                title: "Market Timing Snapshot",
                description:
                  "Days to sell and inventory insights for your area",
              },
              {
                icon: MapPin,
                title: "Neighborhood Activity",
                description: "Active and pending listings nearby",
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="border border-gray-200 bg-white p-8 hover:shadow-lg hover:border-[#2ca699] transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${0.4 + idx * 0.2}s` }}
              >
                <feature.icon className="h-10 w-10 text-[#2ca699] mb-4" />
                <h3 className="text-xl font-semibold text-[#09284b] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
          <div
            className="mt-12 text-center animate-fadeInUp"
            style={{ animationDelay: "1.0s" }}
          >
            <Button
              size="lg"
              className="bg-[#2ca699] hover:bg-[#23917a] text-white"
            >
              See My Home's Signal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section
        id="how-it-works"
        className="bg-gray-100 px-4 py-20 sm:py-28 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#09284b] sm:text-4xl mb-4 animate-fadeInUp">
              Three Steps to Clarity
            </h2>
            <p
              className="text-lg text-gray-600 max-w-2xl mx-auto animate-fadeInUp"
              style={{ animationDelay: "0.2s" }}
            >
              Get your personalized report in minutes
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Enter Your Address",
                description:
                  "Provide your property address to start the process. No account needed.",
                icon: MapPin,
              },
              {
                step: "2",
                title: "We Analyze the Market",
                description:
                  "Our system evaluates 20+ local data points for accurate insights.",
                icon: TrendingUp,
              },
              {
                step: "3",
                title: "Receive Your Report",
                description:
                  "Get a detailed, actionable report delivered to your email.",
                icon: Zap,
              },
            ].map((item, idx) => (
              <Card
                key={idx}
                className="relative p-8 bg-white border border-gray-200 hover:shadow-xl hover:border-[#2ca699] transition-all duration-300 animate-slideIn"
                style={{ animationDelay: `${idx * 0.3}s` }}
              >
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[#2ca699] text-white font-bold text-xl mb-6 mx-auto">
                  {item.step}
                </div>
                <item.icon className="h-12 w-12 text-[#2ca699] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#09284b] text-center mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-center">{item.description}</p>
              </Card>
            ))}
          </div>
          <div
            className="mt-12 text-center animate-fadeInUp"
            style={{ animationDelay: "1.0s" }}
          >
            <Button
              size="lg"
              className="bg-[#2ca699] hover:bg-[#23917a] text-white"
            >
              Start Your Report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section
        id="why-us"
        className="bg-trust-image px-4 py-20 sm:py-28 lg:py-32 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 text-center animate-fadeInUp">
              Beyond the Algorithm: The Local Edge
            </h2>
            <p
              className="text-lg text-white/90 mb-8 leading-relaxed max-w-2xl text-center animate-fadeInUp"
              style={{ animationDelay: "0.2s" }}
            >
              Unlike generic estimates, your Listing Signal™ leverages Las
              Vegas-specific data for unmatched accuracy.
            </p>
            <div className="grid gap-6 md:grid-cols-3 max-w-3xl">
              {[
                "Precision Data",
                "Live Market Insight",
                "Verified Sources",
              ].map((item, idx) => (
                <Card
                  key={idx}
                  className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm border border-gray-200 hover:shadow-lg hover:border-[#2ca699] transition-all duration-300 animate-fadeInUp"
                  style={{ animationDelay: `${0.4 + idx * 0.2}s` }}
                >
                  <CheckCircle2 className="h-6 w-6 text-[#2ca699] flex-shrink-0" />
                  <span className="text-white font-medium">{item}</span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#2ca699] px-4 py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4 animate-fadeInUp">
            Get Your Listing Signal™
          </h2>
          <p
            className="text-lg text-white/90 mb-8 leading-relaxed animate-fadeInUp"
            style={{ animationDelay: "0.2s" }}
          >
            Your personalized report is minutes away. No obligation, just
            clarity.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-[#09284b] hover:bg-[#23917a] hover:text-white animate-fadeInUp"
            style={{ animationDelay: "0.4s" }}
          >
            Get Started Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Form Section */}
      <section
        id="get-signal"
        className="px-4 py-20 sm:py-28 lg:py-32 bg-white"
      >
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#09284b] sm:text-4xl mb-4 animate-fadeInUp">
              Listing Signal™ Form
            </h2>
            <p
              className="text-gray-600 animate-fadeInUp"
              style={{ animationDelay: "0.2s" }}
            >
              Your personalized report is minutes away. No obligation, just
              clarity.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#09284b] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#09284b] mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#09284b] mb-2">
                Property Address *
              </label>
              <input
                type="text"
                name="address"
                placeholder="123 Main St, City, State"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] transition-all"
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#09284b] mb-2">
                  Zip Code *
                </label>
                <input
                  type="text"
                  name="zip"
                  placeholder="12345"
                  value={formData.zip}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#09284b] mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#09284b] mb-2">
                Timeline *
              </label>
              <select
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-[#09284b] focus:outline-none focus:ring-2 focus:ring-[#2ca699] transition-all"
              >
                <option value="">Select timeline...</option>
                <option value="ASAP">Immediately</option>
                <option value="1-3 Months">Within 1 month</option>
                <option value="3-6 Months">Within 3 months</option>
                <option value="6+ Months">Within 6 months</option>
              </select>
            </div>
            <Button
              size="lg"
              className="w-full bg-[#2ca699] hover:bg-[#23917a] text-white"
            >
              Get My Listing Signal™
            </Button>
            <p className="text-xs text-gray-600 text-center">
              By submitting, I agree to receive my Listing Signal™ report and
              follow-up from Listing Signal™. I can unsubscribe anytime.
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#09284b] text-white px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Listing Signal Logo"
                  className="h-14 w-auto"
                />
              </div>
              <p className="text-sm text-gray-200">
                Real-time market data for smarter home selling decisions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    Terms of Use
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#2ca699] transition-colors"
                  >
                    Brokerage Disclaimer
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-200">
            <p>© 2025 Listing Signal. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#2ca699] transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-[#2ca699] transition-colors">
                LinkedIn
              </a>
              <a href="#" className="hover:text-[#2ca699] transition-colors">
                Facebook
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
