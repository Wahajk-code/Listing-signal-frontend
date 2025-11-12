"use client";

import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Radio,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://listingsignal.com";

const US_STATE_ABBREVIATIONS = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

const META_PIXEL_ID = "1197304222269861";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const toStateCode = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const lookup = trimmed.toLowerCase();
  return US_STATE_ABBREVIATIONS[lookup] || "";
};

const extractCityFromAddressComponents = (components = {}) => {
  return (
    components.city ||
    components.town ||
    components.village ||
    components.hamlet ||
    components.municipality ||
    components.locality ||
    components.county ||
    ""
  );
};

const extractStateFromAddressComponents = (components = {}) => {
  const directStateCode =
    components.state_code ||
    components.region_code ||
    components.province_code ||
    "";
  if (directStateCode) {
    return directStateCode.toUpperCase();
  }

  const stateName =
    components.state ||
    components.region ||
    components.province ||
    components.state_district ||
    "";

  const normalized = toStateCode(stateName);
  if (normalized) {
    return normalized;
  }

  return stateName || "";
};

// Button Component
const Button = ({
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ca699] disabled:cursor-not-allowed disabled:opacity-60";
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

const mapPlaceToSuggestion = (place) => {
  if (!place) return null;
  const components = place.address_components || [];
  const findAddressPart = (types, { short } = {}) => {
    for (const component of components) {
      if (types.some((type) => component.types.includes(type))) {
        return short ? component.short_name : component.long_name;
      }
    }
    return "";
  };

  const postalCode = findAddressPart(["postal_code"]);
  const postalCodeSuffix = findAddressPart(["postal_code_suffix"]);
  const streetNumber = findAddressPart(["street_number"]);
  const route = findAddressPart(["route"]);
  const neighborhood = findAddressPart([
    "neighborhood",
    "sublocality",
    "sublocality_level_1",
  ]);
  const city = findAddressPart([
    "locality",
    "postal_town",
    "sublocality",
    "administrative_area_level_3",
  ]);
  const county = findAddressPart(["administrative_area_level_2"]);
  const state = findAddressPart(["administrative_area_level_1"]);
  const stateCode = findAddressPart(["administrative_area_level_1"], {
    short: true,
  });

  const formattedPostal =
    postalCode && postalCodeSuffix
      ? `${postalCode}-${postalCodeSuffix}`
      : postalCode;

  const location = place.geometry?.location;
  const lat =
    typeof location?.lat === "function" ? location.lat() : location?.lat;
  const lon =
    typeof location?.lng === "function" ? location.lng() : location?.lng;

  return {
    label: place.formatted_address || "",
    lat,
    lon,
    address: {
      house_number: streetNumber || "",
      road: route || "",
      neighbourhood: neighborhood || "",
      city: city || "",
      town: city || "",
      county: county || "",
      state: state || "",
      state_code: stateCode || "",
      postcode: formattedPostal || "",
    },
  };
};

const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  error,
  placeholder = "123 Main St, City, State",
  name = "address",
  isGoogleReady = false,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const cacheRef = useRef({});
  const activeRequestRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const fallbackEnabled = !isGoogleReady;

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!fallbackEnabled) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
        activeRequestRef.current = null;
      }
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
    }
  }, [fallbackEnabled]);

  useEffect(() => {
    if (!fallbackEnabled) return;
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fallbackEnabled]);

  const fetchSuggestions = async (query) => {
    if (cacheRef.current[query]) {
      setSuggestions(cacheRef.current[query]);
      setLoadingSuggestions(false);
      return;
    }

    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoadingSuggestions(true);

    try {
      const response = await fetch(
        `/api/address-search?query=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      const data = await response.json();
      const nextSuggestions = data.suggestions || [];
      cacheRef.current[query] = nextSuggestions;
      if (activeRequestRef.current === controller) {
        setSuggestions(nextSuggestions);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Address lookup error:", error);
        if (activeRequestRef.current === controller) {
          setSuggestions([]);
        }
      }
    } finally {
      if (activeRequestRef.current === controller) {
        setLoadingSuggestions(false);
        activeRequestRef.current = null;
      }
    }
  };

  const handleFallbackChange = (event) => {
    const query = event.target.value;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!query || query.length < 3) {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
        activeRequestRef.current = null;
      }
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }
    setShowSuggestions(true);
    if (cacheRef.current[query]) {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
        activeRequestRef.current = null;
      }
      setSuggestions(cacheRef.current[query]);
      setLoadingSuggestions(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 150);
  };

  const handleFallbackSelect = (suggestion) => {
    onSelectRef.current?.(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (
      !isGoogleReady ||
      typeof window === "undefined" ||
      !inputRef.current ||
      !window.google?.maps?.places
    ) {
      return;
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        fields: ["address_components", "formatted_address", "geometry"],
        types: ["address"],
        componentRestrictions: { country: "us" },
      }
    );

    const listener = autocompleteRef.current.addListener(
      "place_changed",
      () => {
        const place = autocompleteRef.current?.getPlace();
        if (!place || !place.formatted_address) {
          return;
        }
        const mappedSuggestion = mapPlaceToSuggestion(place);
        if (mappedSuggestion && onSelectRef.current) {
          onSelectRef.current(mappedSuggestion);
        }
      }
    );

    return () => {
      if (listener?.remove) {
        listener.remove();
      } else if (window.google?.maps?.event && listener) {
        window.google.maps.event.removeListener(listener);
      }
      autocompleteRef.current = null;
    };
  }, [isGoogleReady]);

  const handleFocus = () => {
    if (
      fallbackEnabled &&
      value &&
      value.length >= 3 &&
      suggestions.length > 0
    ) {
      setShowSuggestions(true);
    }
  };

  const hasQuery = (value?.length || 0) >= 3;

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={(event) => {
          onChange(event);
          if (fallbackEnabled) {
            handleFallbackChange(event);
          }
        }}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-lg border ${
          error ? "border-red-500" : "border-gray-300"
        } bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] hover:border-[#2ca699] transition-all duration-200`}
        autoComplete="off"
      />
      {fallbackEnabled && loadingSuggestions && (
        <div className="absolute inset-y-0 right-3 flex items-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-[#2ca699]" />
        </div>
      )}
      {fallbackEnabled &&
        showSuggestions &&
        (suggestions.length > 0 || (!loadingSuggestions && hasQuery)) && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-[#2ca699]/40 bg-white shadow-xl">
            {suggestions.length === 0 && !loadingSuggestions ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No matches found. Try refining your address.
              </div>
            ) : (
              <ul className="max-h-56 overflow-auto text-left">
                {suggestions.map((suggestion) => (
                  <li
                    key={`${suggestion.label}-${suggestion.lat}-${suggestion.lon}`}
                  >
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleFallbackSelect(suggestion)}
                      className="flex w-full flex-col items-start gap-1 px-4 py-3 text-sm text-[#09284b] transition-colors hover:bg-[#f0fdfa]"
                    >
                      <span className="font-medium">
                        {suggestion.address?.house_number &&
                        suggestion.address?.road
                          ? `${suggestion.address.house_number} ${suggestion.address.road}`
                          : suggestion.address?.road || suggestion.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {suggestion.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
    </div>
  );
};

const formatPhoneInput = (value = "") => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const formatZipInput = (value = "") => {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const parseCityState = (address = "") => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const zipIndex = parts.findIndex((part) => /^\d{5}(?:-\d{4})?$/.test(part));

  let stateCandidate = "";
  let cityCandidate = "";

  if (zipIndex > 0) {
    stateCandidate = parts[zipIndex - 1];
    for (let i = zipIndex - 2; i >= 0; i -= 1) {
      const candidate = parts[i];
      if (!/county/i.test(candidate) && !/^\d+/.test(candidate)) {
        cityCandidate = candidate;
        break;
      }
    }
  }

  if (!stateCandidate && parts.length >= 2) {
    stateCandidate = parts[parts.length - 1];
    cityCandidate = parts[parts.length - 2];
  } else if (!stateCandidate && parts.length === 1) {
    cityCandidate = parts[0];
  }

  const normalizedState = toStateCode(stateCandidate) || stateCandidate || "NA";
  const normalizedCity =
    cityCandidate && cityCandidate.length >= 2 ? cityCandidate : "Unknown";

  return { city: normalizedCity, state: normalizedState };
};

const API_URL = process.env.NEXT_PUBLIC_LISTING_SIGNAL_API_URL;

const heroSlides = [
  {
    icon: TrendingUp,
    title: "Signal Strength",
    description:
      "Instantly see how active buyers align with your neighborhood trends.",
  },
  {
    icon: Zap,
    title: "Timing Alerts",
    description:
      "Know the moment supply dips and days-on-market tilt in your favor.",
  },
  {
    icon: MapPin,
    title: "Micro-Market Pulse",
    description:
      "Track pending offers and new listings down to the block level.",
  },
];

const howItWorksSteps = [
  {
    step: "01",
    title: "Tell Us About Your Home",
    description:
      "Start with your address and timeline so we can tailor the Signal.",
    icon: MapPin,
  },
  {
    step: "02",
    title: "We Decode the Data",
    description:
      "Algorithms and advisors analyze 250+ live data points each minute.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "See Your Signal Score",
    description:
      "A clear score, timing insights, and next moves delivered to you.",
    icon: TrendingUp,
  },
];

const signalScorePillars = [
  {
    title: "Market Appreciation Rate",
    weight: "35%",
    color: "#22c55e",
    headline:
      "Tracks how fast prices are rising or falling — higher growth means a stronger market.",
    callouts: [
      {
        icon: "🔺",
        text: "Fast appreciation = higher signal (stronger market)",
      },
      {
        icon: "🔻",
        text: "Decline = lower signal (buyers have leverage)",
      },
    ],
    indexLabel: "1️⃣",
  },
  {
    title: "Sales Velocity",
    weight: "30%",
    color: "#facc15",
    headline:
      "Measures how fast homes are selling near you — fewer days on market means stronger demand.",
    callouts: [
      {
        icon: "🔺",
        text: "Fewer days on market = stronger signal",
      },
      {
        icon: "🔻",
        text: "Slower absorption = weaker signal",
      },
    ],
    indexLabel: "2️⃣",
  },
  {
    title: "Inventory Pressure",
    weight: "25%",
    color: "#3b82f6",
    headline:
      "Shows how many homes are available compared to buyers — less inventory means a stronger seller advantage.",
    callouts: [
      {
        icon: "🏡",
        text: "Low inventory → stronger seller position",
      },
      {
        icon: "🏘️",
        text: "High inventory → softer market",
      },
    ],
    indexLabel: "3️⃣",
  },
  {
    title: "Owner Equity",
    weight: "10%",
    color: "#f97316",
    headline:
      "Compares today’s value to your last sale — revealing how much profit room you may have if you sell now.",
    callouts: [],
    indexLabel: "4️⃣",
  },
];

const signalScoreRanges = [
  {
    range: "80–100",
    label: "Strong Signal",
    meaning: "Seller’s market — excellent timing to list.",
    color: "#22c55e",
    icon: "🟢",
  },
  {
    range: "60–79",
    label: "Steady Signal",
    meaning: "Balanced market — smart prep, timing, and pricing matter most.",
    color: "#facc15",
    icon: "🟡",
  },
  {
    range: "0–59",
    label: "Opportunity Signal",
    meaning:
      "Strong potential—Smart sellers prepare now to stay ahead of the curve",
    color: "#E38102",
    icon: "🟠",
  },
];

const howItWorksOfferCatalog = howItWorksSteps.map((step, index) => ({
  "@type": "ListItem",
  position: index + 1,
  name: step.title,
  description: step.description,
}));

const CTA_TARGET_ID = "get-signal";
const CTA_TARGET_URL = `${SITE_URL}#${CTA_TARGET_ID}`;

const ctaOptions = [
  { label: "Check My Signal" },
  { label: "See My Score" },
  { label: "Get My Report" },
  { label: "Decode My Timing" },
];

export default function Home() {
  const initialFormState = {
    fullName: "",
    email: "",
    address: "",
    zip: "",
    phone: "",
    city: "",
    state: "",
    timeline: "",
    intent: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [activeSlide, setActiveSlide] = useState(0);
  const [signalScore, setSignalScore] = useState(72);
  const [isGenerating, setIsGenerating] = useState(false);
  const gaugeIntervalRef = useRef(null);
  const submitTimerRef = useRef(null);
  const [addressVerified, setAddressVerified] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState(false);
  const [submissionStage, setSubmissionStage] = useState("form"); // form | loading | sms | completed
  const [smsPhone, setSmsPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsError, setSmsError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [isPlacesReady, setIsPlacesReady] = useState(false);
  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Listing Signal",
      alternateName: "Listing Signal™",
      description:
        "Listing Signal™ delivers a personalized Signal to Sell Score so homeowners know the best moment to list, backed by 250+ real-time market indicators.",
      url: SITE_URL,
      image: [`${SITE_URL}/logo.png`],
      serviceType: "Real estate listing timing intelligence",
      brand: {
        "@type": "Brand",
        name: "Listing Signal",
      },
      provider: {
        "@type": "Organization",
        name: "Listing Signal",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
      areaServed: {
        "@type": "Country",
        name: "United States",
      },
      audience: {
        "@type": "Audience",
        audienceType: [
          "Home sellers",
          "Property owners preparing to list",
          "Real estate clients seeking timing strategy",
        ],
      },
      keywords: [
        "listing signal",
        "real estate timing",
        "home selling data",
        "signal to sell score",
        "listing strategy",
      ],
      offers: {
        "@type": "Offer",
        name: "Listing Signal Timing Report",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: CTA_TARGET_URL,
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "How Listing Signal Works",
        itemListElement: howItWorksOfferCatalog,
      },
      potentialAction: {
        "@type": "RegisterAction",
        name: "Request your Listing Signal report",
        target: CTA_TARGET_URL,
      },
    }),
    []
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "phone") {
      nextValue = formatPhoneInput(value);
    } else if (name === "zip") {
      nextValue = formatZipInput(value);
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: nextValue };
      if (name === "address") {
        updated.city = "";
        updated.state = "";
        updated.zip = "";
      }
      return updated;
    });
    if (name === "address") {
      setAddressVerified(false);
    }
    // Clear error for the field when user types
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmissionError("");
  };

  const handleAddressSelect = (suggestion) => {
    const suggestionAddress = suggestion.address || {};
    const suggestionCity = extractCityFromAddressComponents(suggestionAddress);
    const suggestionState =
      extractStateFromAddressComponents(suggestionAddress);
    const formattedZip = suggestion.address?.postcode
      ? formatZipInput(suggestion.address.postcode)
      : "";
    setFormData((prev) => ({
      ...prev,
      address: suggestion.label,
      zip: formattedZip || prev.zip,
      city: suggestionCity || prev.city,
      state: suggestionState || prev.state,
    }));
    setAddressVerified(true);
    setErrors((prev) => ({ ...prev, address: "", zip: "" }));
    setSubmissionError("");
  };

  const handleConfirmToggle = (e) => {
    setConfirmDetails(e.target.checked);
    setErrors((prev) => ({ ...prev, confirmDetails: "" }));
    setSubmissionError("");
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
    setConfirmDetails(false);
    setAddressVerified(false);
    setSubmissionError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.address.trim())
      newErrors.address = "Property Address is required";
    if (!addressVerified)
      newErrors.address =
        "Please select a verified address from the suggestions.";
    const digitsOnly = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (digitsOnly.length < 10)
      newErrors.phone = "Enter a valid phone number.";
    const zipValue = formData.zip.trim();
    const zipRegex = /^\d{5}(?:-\d{4})?$/;
    if (!zipValue) newErrors.zip = "Zip Code is required";
    else if (!zipRegex.test(zipValue))
      newErrors.zip = "Enter a valid 5-digit ZIP (optionally with +4).";
    if (!formData.timeline) newErrors.timeline = "Timeline is required";
    if (!formData.intent)
      newErrors.intent = "Please share your selling timeline.";
    if (!confirmDetails)
      newErrors.confirmDetails =
        "Please confirm your details before generating your report.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError("");
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const fallbackLocation = parseCityState(formData.address);
    const city = formData.city || fallbackLocation.city;
    const state =
      formData.state ||
      toStateCode(fallbackLocation.state) ||
      fallbackLocation.state;
    const cleanedCity = city ? city.trim() : "";
    const cleanedState =
      state && state.length === 2
        ? state.trim().toUpperCase()
        : state?.trim() || "";

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      streetAddress: formData.address.trim(),
      city: cleanedCity,
      state: cleanedState,
      zip: formData.zip.trim(),
      timeline: formData.timeline,
      intent: formData.intent,
      responseMode: "json",
    };

    if (!API_URL) {
      console.error(
        "Missing NEXT_PUBLIC_LISTING_SIGNAL_API_URL environment variable."
      );
      setSubmissionError(
        "We’re unable to reach the Listing Signal service right now. Please try again soon."
      );
      return;
    }

    setSubmissionStage("loading");
    setSmsConsent(false);
    setSmsError("");
    setSmsPhone(formData.phone);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Request failed");
      }
    } catch (error) {
      console.error("Listing Signal API error:", error);
      setSubmissionStage("form");
      setSubmissionError(
        "Something went wrong sending your request. Please double-check your details or try again later."
      );
      return;
    }

    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }
    submitTimerRef.current = setTimeout(() => {
      setSubmissionStage("sms");
      submitTimerRef.current = null;
    }, 3200);
  };

  const handleScroll = (sectionId, e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSmsSubmit = (e) => {
    e.preventDefault();
    if (!smsConsent) {
      setSmsError("Please consent to receive SMS updates.");
      return;
    }
    const digitsOnly = smsPhone.replace(/\D/g, "");
    if (!smsPhone.trim() || digitsOnly.length < 10) {
      setSmsError("Enter a valid phone number to receive texts.");
      return;
    }
    console.log("SMS opt-in:", { phone: smsPhone, consent: smsConsent });
    setSmsError("");
    setSubmissionStage("completed");
  };

  const handleSkipSms = () => {
    setSmsError("");
    setSmsConsent(false);
    setSubmissionStage("completed");
    setSubmissionError("");
  };

  const handleFinish = () => {
    resetForm();
    setSubmissionStage("form");
    setSmsConsent(false);
    setSmsPhone("");
    setSmsError("");
    setSubmissionError("");
  };

  const handleSmsPhoneChange = (e) => {
    const formatted = formatPhoneInput(e.target.value);
    setSmsPhone(formatted);
    setSmsError("");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (gaugeIntervalRef.current) {
        clearInterval(gaugeIntervalRef.current);
      }
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (submissionStage === "completed" && typeof window !== "undefined") {
      const fbq = window.fbq;
      if (typeof fbq === "function") {
        fbq("track", "Lead");
      }
    }
  }, [submissionStage]);

  const handleGenerateSignal = (event) => {
    handleScroll("get-signal", event);
    if (isGenerating) return;
    if (gaugeIntervalRef.current) {
      clearInterval(gaugeIntervalRef.current);
    }
    setIsGenerating(true);
    setSignalScore(0);
    const target = 65 + Math.floor(Math.random() * 26); // 65-90
    let current = 0;
    gaugeIntervalRef.current = setInterval(() => {
      current += 3;
      setSignalScore((prev) => {
        const next = prev + 3;
        return next > target ? target : next;
      });
      if (current >= target) {
        clearInterval(gaugeIntervalRef.current);
        gaugeIntervalRef.current = null;
        setIsGenerating(false);
      }
    }, 80);
  };

  const gaugeProgress = Math.max(0, Math.min(signalScore, 100));
  const timingLabel =
    gaugeProgress >= 85
      ? "Prime Window"
      : gaugeProgress >= 70
      ? "Momentum Building"
      : "Monitoring";

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      {GOOGLE_MAPS_API_KEY && (
        <Script
          id="google-maps-places"
          strategy="afterInteractive"
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
          onLoad={() => setIsPlacesReady(true)}
          onError={(event) => {
            console.error("Failed to load Google Maps Places script.", event);
            setIsPlacesReady(false);
          }}
        />
      )}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Script
        id="listing-signal-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(structuredData)}
      </Script>
      <div className="min-h-screen bg-white">
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }
          body {
            background-color: #f7fafc;
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
          @keyframes heroWave {
            0% {
              transform: translate3d(-10%, 0, 0) scale(1);
              opacity: 0.35;
            }
            50% {
              transform: translate3d(0%, 5%, 0) scale(1.05);
              opacity: 0.55;
            }
            100% {
              transform: translate3d(10%, 0, 0) scale(1);
              opacity: 0.35;
            }
          }
          @keyframes pulseGlow {
            0%,
            100% {
              opacity: 0.25;
            }
            50% {
              opacity: 0.45;
            }
          }
          .pulse-glow {
            animation: pulseGlow 6s ease-in-out infinite;
          }
          .hero-gradient {
            background: radial-gradient(
                circle at 30% 20%,
                rgba(136, 241, 229, 0.25),
                transparent 45%
              ),
              radial-gradient(
                circle at 70% 0%,
                rgba(44, 166, 153, 0.35),
                transparent 35%
              ),
              linear-gradient(
                180deg,
                rgba(6, 26, 51, 0.95),
                rgba(9, 40, 75, 0.9)
              );
          }
          .signal-wave {
            position: absolute;
            inset: -10% 0;
          }
          .signal-wave::before,
          .signal-wave::after {
            content: "";
            position: absolute;
            left: 50%;
            top: 50%;
            width: 140%;
            height: 140%;
            transform: translate(-50%, -50%);
            background: conic-gradient(
              from 180deg,
              rgba(136, 241, 229, 0.12),
              rgba(44, 166, 153, 0.05) 35%,
              transparent 70%
            );
            border-radius: 45%;
            filter: blur(0.5px);
            animation: heroWave 9s ease-in-out infinite alternate;
          }
          .signal-wave::after {
            animation-delay: -4s;
            opacity: 0.35;
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
                  onClick={(e) => handleScroll("home", e)}
                  className="text-sm text-white hover:text-[#2ca699] transition-colors"
                >
                  Home
                </a>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleScroll("how-it-works", e)}
                  className="text-sm text-white hover:text-[#2ca699] transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#why-us"
                  onClick={(e) => handleScroll("why-us", e)}
                  className="text-sm text-white hover:text-[#2ca699] transition-colors"
                >
                  Why Us
                </a>
                <Button
                  onClick={(e) => handleScroll("get-signal", e)}
                  className="bg-[#2ca699] hover:bg-[#23917a] text-white"
                >
                  Get Your Signal Now
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          id="home"
          className="relative overflow-hidden bg-[#061a33] px-4 py-24 sm:py-32 lg:py-40 text-white"
        >
          <div className="absolute inset-0 hero-gradient pulse-glow" />
          <div className="signal-wave pointer-events-none" />
          <div className="mx-auto max-w-7xl flex flex-col items-center text-center relative z-10">
            <div className="animate-fadeInUp text-xs uppercase tracking-[0.4em] text-[#88f1e5]/70 mb-4">
              Real-Time Listing Intelligence
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance max-w-3xl mb-6 animate-fadeInUp">
              Timing, Decoded.
            </h1>
            <p
              className="text-lg sm:text-2xl text-white/90 max-w-3xl leading-relaxed animate-fadeInUp"
              style={{ animationDelay: "0.15s" }}
            >
              The clarity to know when the market is on your side.
            </p>
            <p
              className="mt-4 text-base sm:text-lg text-white/70 animate-fadeInUp"
              style={{ animationDelay: "0.3s" }}
            >
              Every Home Sends a Signal — We Read It.
            </p>

            <div className="relative mt-10 w-full max-w-xl">
              <div className="absolute inset-0 rounded-3xl bg-white/5 blur-3xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur p-6 shadow-lg transition-transform duration-500 hover:-translate-y-1">
                <div className="relative min-h-[220px]">
                  {heroSlides.map((slide, idx) => {
                    const isActive = idx === activeSlide;
                    return (
                      <div
                        key={slide.title}
                        className={`absolute inset-0 flex h-full flex-col items-center justify-center gap-4 text-center transition-all duration-700 ${
                          isActive
                            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                            : "opacity-0 translate-y-6 scale-95 pointer-events-none"
                        }`}
                        aria-hidden={!isActive}
                      >
                        <slide.icon className="h-14 w-14 text-[#88f1e5] transition-transform duration-700" />
                        <h3 className="text-2xl font-semibold">
                          {slide.title}
                        </h3>
                        <p className="text-sm sm:text-base text-white/75 max-w-sm">
                          {slide.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-center gap-2">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                        idx === activeSlide ? "bg-[#88f1e5]" : "bg-white/30"
                      }`}
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Show slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div
              className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2 animate-fadeInUp"
              style={{ animationDelay: "0.45s" }}
            >
              {ctaOptions.map((cta) => (
                <Button
                  key={cta.label}
                  size="lg"
                  onClick={(e) => handleScroll(CTA_TARGET_ID, e)}
                  className="group bg-[#2ca699] text-white shadow-lg shadow-[#05203f]/20 transition-all duration-300 hover:bg-[#23917a] hover:shadow-[#05203f]/30"
                >
                  {cta.label}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              ))}
            </div>

            <button
              onClick={(e) => handleScroll("inside-signal", e)}
              className="mt-14 flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white animate-fadeInUp"
              style={{ animationDelay: "0.6s" }}
            >
              Scroll to decode your Signal
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Inside Your Signal Section */}
        <section
          id="inside-signal"
          className="bg-gradient-to-b from-white via-white to-[#f1f7ff] px-4 py-20 sm:py-28 lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
            <div className="animate-fadeInUp">
              <h2 className="text-3xl font-bold tracking-tight text-[#09284b] sm:text-4xl mb-6">
                Inside Your Signal
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We translate 250+ live data points into one clear Signal to Sell
                Score. No spreadsheets, no guesswork—just the precise timing you
                need.
              </p>
              <div className="space-y-5">
                {[
                  {
                    title: "Selling Score",
                    description:
                      "Your home’s real-time Signal strength — a data-backed snapshot of how favorable market conditions are for selling.",
                  },
                  {
                    title: "Pricing Confidence",
                    description:
                      "MLS-backed valuation bands with current and projected listing spreads.",
                  },
                  {
                    title: "Neighborhood Pulse",
                    description:
                      "Active, pending, and withdrawn listings that influence your competitive edge.",
                  },
                ].map((item, idx) => (
                  <div
                    key={item.title}
                    className="group flex items-start gap-4 rounded-xl border border-[#2ca699]/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#2ca699]/40 hover:shadow-lg"
                    style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                  >
                    <Radio className="mt-1 h-6 w-6 text-[#2ca699] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
                    <div>
                      <h3 className="text-lg font-semibold text-[#09284b]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-10 rounded-3xl bg-[#2ca699]/10 blur-3xl" />
              <Card
                id="signal-score"
                className="relative z-10 overflow-hidden border-none bg-white p-10 shadow-2xl animate-fadeInUp"
              >
                <div className="mb-8 flex flex-col items-center gap-6">
                  <div
                    className="relative flex h-48 w-48 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#88f1e5 ${
                        gaugeProgress * 3.6
                      }deg, rgba(136, 241, 229, 0.12) ${
                        gaugeProgress * 3.6
                      }deg 360deg)`,
                      transition: "background 0.45s ease",
                    }}
                  >
                    <div className="absolute inset-5 rounded-full bg-[#061a33]/95 shadow-inner" />
                    <div className="relative flex flex-col items-center justify-center rounded-full bg-[#061a33] px-10 py-12 text-white">
                      <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                        Signal Score
                      </span>
                      <span className="text-5xl font-semibold">
                        {gaugeProgress}
                      </span>
                      <span className="mt-2 text-sm text-[#88f1e5]">
                        {timingLabel}
                      </span>
                    </div>
                    <div className="absolute inset-0 animate-pulse rounded-full border border-white/10" />
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-sm uppercase tracking-widest text-[#2ca699]">
                      250+ Data Points Synthesized
                    </span>
                    <p className="text-sm text-gray-600 max-w-sm">
                      We analyze local trends, buyer activity, and pricing
                      patterns to reveal how strong your market really is.
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="group w-full bg-[#2ca699] text-white hover:bg-[#09284b] transition-all duration-300 disabled:cursor-not-allowed disabled:bg-[#2ca699]/60"
                  onClick={handleGenerateSignal}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Decoding…" : "Generate My Signal"}
                  {!isGenerating && (
                    <ArrowRight className="ml-3 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  )}
                </Button>
                <div className="mt-6 flex items-center justify-between rounded-lg bg-[#f5faf9] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#2ca699] animate-ping" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#09284b]">
                      Live Feed
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {isGenerating
                      ? "Analyzing comps, demand, velocity…"
                      : "Ready for your next move."}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Signal Score Meaning Section */}
        <section
          id="signal-meaning"
          className="bg-gradient-to-b from-[#f5fbff] via-white to-[#eef6ff] px-4 py-20 sm:py-28 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#d8f3ec] px-4 py-2 text-sm font-semibold text-[#0e3d70]">
                <span aria-hidden="true">💡</span>
                <span>What the Signal Score Really Means</span>
              </div>
              <p className="mt-6 text-lg text-gray-600">
                Your Signal to Sell™ Score shows how ready your local market is
                for selling — not a grade on your home.
              </p>
              <p className="mt-4 text-lg text-gray-600">
                It measures today’s real demand, pricing trends, and competition
                around you.
              </p>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-[#2ca699]">
                Powered by 4 Core Market Signals - Realtime
              </p>
            </div>
            <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
              <div className="space-y-6">
                {signalScorePillars.map((pillar, idx) => (
                  <div
                    key={pillar.title}
                    className="group rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{
                      borderColor: `${pillar.color}33`,
                      boxShadow:
                        idx % 2 === 0
                          ? `0 22px 40px -28px ${pillar.color}80`
                          : `0 18px 36px -28px ${pillar.color}66`,
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold text-[#09284b]"
                        style={{ backgroundColor: `${pillar.color}26` }}
                      >
                        {pillar.indexLabel}
                      </span>
                      <h3 className="text-lg font-semibold text-[#09284b]">
                        {pillar.title}
                      </h3>
                      <span className="ml-auto inline-flex items-center rounded-full bg-[#2ca699]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2ca699]">
                        {pillar.weight}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      {pillar.headline}
                    </p>
                    {pillar.callouts.length > 0 && (
                      <ul className="mt-3 space-y-2 text-sm text-gray-600">
                        {pillar.callouts.map((point) => (
                          <li
                            key={`${pillar.title}-${point.text}`}
                            className="flex items-start gap-2"
                          >
                            <span
                              className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center text-base leading-5"
                              aria-hidden="true"
                            >
                              {point.icon}
                            </span>
                            <span>{point.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <Card className="border-[#2ca699]/20 bg-white/90 p-8 shadow-lg backdrop-blur">
                  <h3 className="text-xl font-semibold text-[#09284b]">
                    Score Range
                  </h3>
                  <div className="mt-6 space-y-4">
                    {signalScoreRanges.map((row) => (
                      <div
                        key={row.label}
                        className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{
                          borderColor: `${row.color}33`,
                          backgroundColor: `${row.color}0d`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" aria-hidden="true">
                            {row.icon}
                          </span>
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-[#09284b]">
                              {row.label}
                            </p>
                            <p className="text-xs font-medium text-[#2ca699]">
                              {row.range}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 sm:max-w-xs">
                          {row.meaning}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
                <p className="text-sm text-gray-600">
                  Your Signal Score reads the market around your home — how
                  quickly things are selling, where prices are trending, and how
                  much inventory there is. A higher score means the market is in
                  your favor; a lower one means it’s still building strength.
                  It’s a timing index for your neighborhood — not an appraisal,
                  but a smart indicator of how ready the market is for your home
                  to sell.
                </p>
                <Button
                  size="lg"
                  onClick={(e) => handleScroll("get-signal", e)}
                  className="group w-full bg-[#2ca699] text-white transition-all duration-300 hover:bg-[#09284b]"
                >
                  Check My Signal Score
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section
          id="how-it-works"
          className="bg-gradient-to-b from-[#f1f7ff] via-white to-[#f0f6ff] px-4 py-20 sm:py-28 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#09284b] sm:text-4xl mb-4 animate-fadeInUp">
                How Listing Signal Works
              </h2>
              <p
                className="text-lg text-gray-600 max-w-2xl mx-auto animate-fadeInUp"
                style={{ animationDelay: "0.2s" }}
              >
                Three simple steps turn raw market noise into your personalized
                Signal to Sell Score.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {howItWorksSteps.map((item, idx) => (
                <Card
                  key={idx}
                  className="group relative overflow-hidden p-8 bg-white/90 border border-[#2ca699]/15 backdrop-blur hover:-translate-y-2 hover:border-[#2ca699]/40 hover:shadow-2xl transition-all duration-500 animate-slideIn"
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#2ca699]/8 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-[#2ca699] text-white font-bold text-lg tracking-widest mb-6 mx-auto">
                    {item.step}
                  </div>
                  <item.icon className="relative h-12 w-12 text-[#2ca699] mx-auto mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1" />
                  <h3 className="relative text-xl font-semibold text-[#09284b] text-center mb-3">
                    {item.title}
                  </h3>
                  <p className="relative text-gray-600 text-center">
                    {item.description}
                  </p>
                </Card>
              ))}
            </div>
            <div
              className="mt-12 text-center animate-fadeInUp"
              style={{ animationDelay: "1.0s" }}
            >
              <Button
                size="lg"
                onClick={(e) => handleScroll("get-signal", e)}
                className="group bg-[#2ca699] hover:bg-[#09284b] text-white transition-all duration-300"
              >
                Move to My Best Timing
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
        <section className="relative overflow-hidden bg-gradient-to-br from-[#09284b] via-[#0e3d70] to-[#2ca699] px-4 py-20 sm:py-28 lg:py-32">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="mx-auto max-w-4xl text-center relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4 animate-fadeInUp">
              Ready to Decode Your Timing?
            </h2>
            <p
              className="text-lg text-white/85 mb-10 leading-relaxed animate-fadeInUp"
              style={{ animationDelay: "0.2s" }}
            >
              Your Signal to Sell Score reveals the exact window to launch, with
              data-backed moves to keep you ahead of the market.
            </p>
            <div
              className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2 animate-fadeInUp"
              style={{ animationDelay: "0.35s" }}
            >
              {ctaOptions.map((cta) => (
                <Button
                  key={cta.label}
                  variant="default"
                  size="lg"
                  onClick={(e) => handleScroll(CTA_TARGET_ID, e)}
                  className="shadow-lg shadow-[#021b36]/20 transition-all duration-300 hover:bg-[#23917a] hover:shadow-[#021b36]/30 focus:ring-offset-[#0e3d70]"
                >
                  {cta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section
          id="get-signal"
          className="px-4 py-20 sm:py-28 lg:py-32 bg-gray-50"
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#09284b] sm:text-4xl mb-4 animate-fadeInUp">
                Listing Signal™ Form
              </h2>
              <p
                className="text-lg text-gray-600 animate-fadeInUp"
                style={{ animationDelay: "0.2s" }}
              >
                Your personalized report is minutes away. No obligation, just
                clarity.
              </p>
            </div>
            <Card className="p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div
                    className="relative animate-fadeInUp"
                    style={{ animationDelay: "0.4s" }}
                  >
                    <label className="block text-sm font-semibold text-[#09284b] mb-2">
                      Full Name <span className="text-[#2ca699]">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.fullName ? "border-red-500" : "border-gray-300"
                      } bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] hover:border-[#2ca699] transition-all duration-200`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div
                    className="relative animate-fadeInUp"
                    style={{ animationDelay: "0.5s" }}
                  >
                    <label className="block text-sm font-semibold text-[#09284b] mb-2">
                      Email <span className="text-[#2ca699]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      } bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] hover:border-[#2ca699] transition-all duration-200`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className="relative animate-fadeInUp"
                  style={{ animationDelay: "0.6s" }}
                >
                  <label className="block text-sm font-semibold text-[#09284b] mb-2">
                    Property Address <span className="text-[#2ca699]">*</span>
                  </label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={handleInputChange}
                    onSelect={handleAddressSelect}
                    error={errors.address}
                    isGoogleReady={isPlacesReady}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {addressVerified
                        ? "Address verified"
                        : "Begin typing to verify your address."}
                    </span>
                    {addressVerified && (
                      <span className="flex items-center gap-1 text-[#2ca699]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.address}
                    </p>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div
                    className="relative animate-fadeInUp"
                    style={{ animationDelay: "0.7s" }}
                  >
                    <label className="block text-sm font-semibold text-[#09284b] mb-2">
                      Zip Code <span className="text-[#2ca699]">*</span>
                    </label>
                    <input
                      type="text"
                      name="zip"
                      placeholder="12345"
                      value={formData.zip}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.zip ? "border-red-500" : "border-gray-300"
                      } bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] hover:border-[#2ca699] transition-all duration-200`}
                    />
                    {errors.zip && (
                      <p className="mt-1 text-xs text-red-500">{errors.zip}</p>
                    )}
                  </div>
                  <div
                    className="relative animate-fadeInUp"
                    style={{ animationDelay: "0.8s" }}
                  >
                    <label className="block text-sm font-semibold text-[#09284b] mb-2">
                      Phone <span className="text-[#2ca699]">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } bg-white text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] hover:border-[#2ca699] transition-all duration-200`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className="relative animate-fadeInUp"
                  style={{ animationDelay: "0.9s" }}
                >
                  <label className="block text-sm font-semibold text-[#09284b] mb-2">
                    Timeline <span className="text-[#2ca699]">*</span>
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.timeline ? "border-red-500" : "border-gray-300"
                    } bg-white text-[#09284b] focus:outline-none focus:ring-2 focus:ring-[#2ca699] hover:border-[#2ca699] transition-all duration-200`}
                  >
                    <option value="">Select timeline...</option>
                    <option value="ASAP">Immediately</option>
                    <option value="1-3 Months">Within 1 month</option>
                    <option value="3-6 Months">Within 3 months</option>
                    <option value="6+ Months">Within 6 months</option>
                  </select>
                  {errors.timeline && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.timeline}
                    </p>
                  )}
                </div>
                <div
                  className="relative animate-fadeInUp"
                  style={{ animationDelay: "0.95s" }}
                >
                  <span className="block text-sm font-semibold text-[#09284b]">
                    Are you considering selling your home in the next 12 months?
                    <span className="text-[#2ca699]">*</span>
                  </span>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {["Yes", "Not Sure", "No"].map((option) => (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm transition-all duration-200 ${
                          formData.intent === option
                            ? "border-[#2ca699] bg-[#f0fdfa] text-[#09284b]"
                            : "border-gray-300 bg-white text-gray-600 hover:border-[#2ca699]/50"
                        }`}
                      >
                        <span>{option}</span>
                        <input
                          type="radio"
                          name="intent"
                          value={option}
                          checked={formData.intent === option}
                          onChange={handleInputChange}
                          className="text-[#2ca699] focus:ring-[#2ca699]"
                        />
                      </label>
                    ))}
                  </div>
                  {errors.intent && (
                    <p className="mt-2 text-xs text-red-500">{errors.intent}</p>
                  )}
                </div>
                <div
                  className="relative animate-fadeInUp"
                  style={{ animationDelay: "0.98s" }}
                >
                  <label className="flex items-start gap-3 rounded-lg border border-[#2ca699]/30 bg-[#f6fffd] px-4 py-3 text-sm text-[#09284b] shadow-sm">
                    <input
                      type="checkbox"
                      checked={confirmDetails}
                      onChange={handleConfirmToggle}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2ca699] focus:ring-[#2ca699]"
                    />
                    <span>
                      Please confirm your details are correct before generating
                      your report.
                    </span>
                  </label>
                  {errors.confirmDetails && (
                    <p className="mt-2 text-xs text-red-500">
                      {errors.confirmDetails}
                    </p>
                  )}
                </div>
                {submissionError && submissionStage === "form" && (
                  <p className="text-sm text-red-500 text-center animate-fadeInUp">
                    {submissionError}
                  </p>
                )}
                <Button
                  size="lg"
                  disabled={submissionStage !== "form"}
                  className="w-full bg-[#2ca699] hover:bg-[#23917a] text-white transform hover:scale-105 transition-transform duration-200 animate-fadeInUp"
                  style={{ animationDelay: "1.0s" }}
                >
                  Get My Listing Signal™
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p
                  className="text-sm text-gray-500 text-center italic animate-fadeInUp"
                  style={{ animationDelay: "1.1s" }}
                >
                  By submitting, I agree to receive my Listing Signal™ report
                  and follow-up from Listing Signal™. I can unsubscribe anytime.
                </p>
              </form>
            </Card>
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

        {submissionStage !== "form" && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#021022]/80 px-4 backdrop-blur-sm">
            {submissionStage === "loading" && (
              <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-[#061a33] px-10 py-12 text-center text-white shadow-2xl">
                <span className="text-xs uppercase tracking-[0.4em] text-[#88f1e5]/60">
                  Processing
                </span>
                <h3 className="text-2xl font-semibold">
                  Your Signal is generating…
                </h3>
                <p className="text-sm text-white/70">
                  We’re syncing with live market data to build your report.
                </p>
                <span className="h-12 w-12 animate-spin rounded-full border-2 border-[#88f1e5]/30 border-t-[#88f1e5]" />
              </div>
            )}

            {submissionStage === "sms" && (
              <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold text-[#09284b] text-center">
                  Would you like your Signal texted to you as soon as it’s
                  ready?
                </h3>
                <p className="mt-3 text-sm text-gray-600 text-center">
                  Keep your timing intel close—opt in for a text alert the
                  moment your Signal is live.
                </p>
                <form onSubmit={handleSmsSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#09284b] mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={handleSmsPhoneChange}
                      placeholder="(555) 987-6543"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#09284b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ca699] hover:border-[#2ca699] transition-all duration-200"
                    />
                  </div>
                  <label className="flex items-start gap-3 rounded-lg border border-[#2ca699]/30 bg-[#f6fffd] px-4 py-3 text-sm text-[#09284b]">
                    <input
                      type="checkbox"
                      checked={smsConsent}
                      onChange={(event) => {
                        setSmsConsent(event.target.checked);
                        setSmsError("");
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2ca699] focus:ring-[#2ca699]"
                    />
                    <span>
                      Yes, text me updates about my Signal. I understand
                      standard messaging rates may apply and I can opt out
                      anytime.
                    </span>
                  </label>
                  {smsError && (
                    <p className="text-xs text-red-500">{smsError}</p>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1 bg-[#2ca699] text-white hover:bg-[#09284b]"
                    >
                      Send My Signal via Text
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1 border border-[#2ca699]/40 bg-white text-[#09284b] hover:bg-[#f0fdfa]"
                      onClick={handleSkipSms}
                    >
                      No thanks
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {submissionStage === "completed" && (
              <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-white px-10 py-12 text-center shadow-2xl">
                <noscript>
                  <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=Lead&noscript=1`}
                    alt=""
                  />
                </noscript>
                <h3 className="text-2xl font-semibold text-[#09284b]">
                  You’re all set!
                </h3>
                <p className="text-sm text-gray-600">
                  We’ll deliver your Signal report via email
                  {smsConsent ? " and text" : ""} as soon as it’s ready.
                </p>
                <Button
                  size="lg"
                  className="bg-[#2ca699] text-white hover:bg-[#09284b]"
                  onClick={handleFinish}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
