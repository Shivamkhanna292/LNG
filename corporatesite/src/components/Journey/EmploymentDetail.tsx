"use client";

import { JSX, useState, ChangeEvent, FormEvent, useEffect,useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Field, withDatasourceCheck } from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import { event } from "@sitecore-cloudsdk/events/browser";
import { CdpHelper, useSitecore } from "@sitecore-content-sdk/nextjs";
import config from "sitecore.config";
import Cookies from "js-cookie";
import {
  UpdateGuestExtensionV3,
} from "../../lib/cdp/cdpService";
import {
  DecisionOffersResponse,
  getNextPageFromExperience,
} from "../../lib/personalize/personalizeService";

type ContentBlockProps = ComponentProps & {
  fields: {
    Header: Field<string>;
  };
};

const EmploymentDetail = ({ fields }: ContentBlockProps): JSX.Element => {
  // Initialize CDP and Router Starts
  const { page } = useSitecore();
  const itemId = page.layout.sitecore.route?.itemId || "";
  const language =
    page.layout.sitecore.route?.itemLanguage || config.defaultLanguage;
  const scope = config.personalize?.scope;
  const pageVariantId = CdpHelper.getPageVariantId(
    itemId,
    language,
    page.layout.sitecore.context.variantId as string,
    scope
  );
  // Initialize CDP and Router Ends

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    monthlyIncome: "",
  });

  const slides = [
    {
      img: "/journey/images/pl-slider-1.jpg",
      title: "Personal Loan Guidance for Every Credit Profile",
    },
    {
      img: "/journey/images/pl-slider-2.jpg",
      title: "Personal Loan Solutions Tailored for You",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);    

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    // You can handle API call or navigation here

    setIsSubmitting(true);

    // Log Event
    try {
      await event({
        type: "EmploymentDetail",
        channel: "WEB",
        currency: "USD",
        page: page.layout.sitecore.route?.name,
        pageVariantId,
        language,
        payload: {
          BankName: formData.bankName,
          MonthlyIncome: formData.monthlyIncome,
        },
      });
    } catch (err) {
      console.error("Employment Detail - Error sending event to CDP:", err);
    }

    const guestRef = Cookies.get("CDP_Guest_Ref");
    const guestIdNumber = Cookies.get("CDP_Guest_IdNumber");

    // 👉 Update guest in CDP
    try {
      const response = await UpdateGuestExtensionV3(
        guestRef ?? "",
        "employment-detail",
        formData.bankName,
        formData.monthlyIncome
      );
      console.log(
        "Employment Detail - Guest successfully updated in CDP: ",
        response
      );
    } catch (innerErr) {
      console.error(
        "Employment Detail - Error in updating guest data in CDP:",
        innerErr
      );
    }

    // 👉 Call Experience
    try {
      let experienceResponse: DecisionOffersResponse | null = null;
      experienceResponse = await getNextPageFromExperience(guestIdNumber ?? "");

      const nextPageURL = experienceResponse?.NextPageURL?.trim();
      const journeySelected = experienceResponse?.JourneySelected?.trim();

      // Validate
      if (!nextPageURL) {
        console.warn(
          "Employment Detail - NextPageURL missing from experience response"
        );
        return;
      }

      if (!journeySelected) {
        console.warn(
          "Employment Detail - JourneySelected missing from experience response"
        );
        return;
      }

      console.log("Employment Detail - NextPageURL:", nextPageURL);
      console.log("Employment Detail - JourneySelected:", journeySelected);

      // 👉 Update guest in CDP
      try {
        const response = await UpdateGuestExtensionV3(
          guestRef ?? "",
          nextPageURL,
          formData.bankName,
          formData.monthlyIncome
        );
        console.log(
          "Employment Detail - Guest successfully updated in CDP: ",
          response
        );
      } catch (innerErr) {
        console.error(
          "Employment Detail - Error in updating guest data in CDP:",
          innerErr
        );
      }

      // 👉 Redirect to next page
      router.push(`/demo/${nextPageURL.replace(/^\/+/, "")}`);
    } catch (err) {
      console.error("Employment Detail - Error in Experience Call:", err);
    }

    setIsSubmitting(false);
  };

  // -------------------------
  // PL Carousel (React-only)
  // -------------------------
  const plSlides = [
    {
      issuer: "Premier Bank",
      name: "Quick Cash Loan",
      rate: "8.99%",
      amountValue: "Up to $50K",
      amountLabel: "24-Hour Approval",
      styleClass: "pl-card-purple",
    },
    {
      issuer: "City Finance",
      name: "Express Loan",
      rate: "9.49%",
      amountValue: "Up to $35K",
      amountLabel: "Same Day Funding",
      styleClass: "pl-card-pink",
    },
    {
      issuer: "Metro Lending",
      name: "Instant Approval",
      rate: "7.99%",
      amountValue: "Up to $40K",
      amountLabel: "No Origination Fee",
      styleClass: "pl-card-orange",
    },
  ];

  const [plIndex, setPlIndex] = useState(0);
  const plTrackRef = useRef<HTMLDivElement | null>(null);
  const plContainerRef = useRef<HTMLDivElement | null>(null);
  const [plSlideWidth, setPlSlideWidth] = useState(0);
  const plAutoRef = useRef<number | null>(null);

  // touch/swipe refs
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);

  // compute slide width and set transform
  useEffect(() => {
    const updateWidth = () => {
      const firstSlide = plTrackRef.current?.children?.[0] as
        | HTMLElement
        | undefined;
      if (firstSlide) {
        const w = firstSlide.getBoundingClientRect().width;
        setPlSlideWidth(w);
      } else {
        setPlSlideWidth(0);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // apply transform whenever index or width changes
  const getPlTrackStyle = () => {
    const translate = plIndex * plSlideWidth;
    return {
      transform: `translateX(-${translate}px)`,
      transition: "transform 450ms ease",
      willChange: "transform",
    } as React.CSSProperties;
  };

  // autoplay
  useEffect(() => {
    const startAuto = () => {
      stopAuto();
      plAutoRef.current = window.setInterval(() => {
        setPlIndex((prev) => (prev + 1) % plSlides.length);
      }, 3000);
    };

    const stopAuto = () => {
      if (plAutoRef.current) {
        window.clearInterval(plAutoRef.current);
        plAutoRef.current = null;
      }
    };

    startAuto();
    // stop on unmount
    return () => stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plSlideWidth]);

  // pause on hover handlers
  const handlePlMouseEnter = () => {
    if (plAutoRef.current) {
      window.clearInterval(plAutoRef.current);
      plAutoRef.current = null;
    }
  };
  const handlePlMouseLeave = () => {
    if (!plAutoRef.current) {
      plAutoRef.current = window.setInterval(() => {
        setPlIndex((prev) => (prev + 1) % plSlides.length);
      }, 3000);
    }
  };

  // touch handlers
  const onPlTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = touchStartX.current;
    isDragging.current = true;
    if (plAutoRef.current) {
      window.clearInterval(plAutoRef.current);
      plAutoRef.current = null;
    }
  };

  const onPlTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const onPlTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = touchStartX.current - touchCurrentX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // swipe left -> next
        setPlIndex((prev) => (prev + 1) % plSlides.length);
      } else {
        // swipe right -> prev
        setPlIndex((prev) => (prev - 1 + plSlides.length) % plSlides.length);
      }
    }
    // restart autoplay
    if (!plAutoRef.current) {
      plAutoRef.current = window.setInterval(() => {
        setPlIndex((prev) => (prev + 1) % plSlides.length);
      }, 3000);
    }
  };

  return (
    <div className="daform-wrapper pl-bg">
      <div className="container-fluid daform-container">
        <div className="row">
          {/* Left Section: Form */}
          <div className="col-lg-6 daform-left-section">
            <article className="da-left-hld">
              <div className="daform-logo">
                <Image
                  src="/journey/images/lng-logo-new-7.png"
                  alt="L&G Logo"
                />
              </div>
              <h1 className="daform-heading">{fields.Header.value}</h1>
              <p className="daform-subheading">
                {
                  "Fill in your details and we'll check your eligibility for our financial products"
                }
              </p>
              {/* -------------------- Form Starts ---------------------- */}
              <form id="daformApplicationForm" onSubmit={handleSubmit}>
                <div className="daform-form-group">
                  <div className="daform-input-wrapper">
                    <input
                      type="text"
                      className="daform-input"
                      autoFocus
                      id="bankName"
                      placeholder="Enter your bank name"
                      value={formData.bankName}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-7.png"
                      alt="ID"
                      className="daform-input-icon"
                    />
                  </div>
                </div>
                <div className="daform-form-group">
                  <div className="daform-input-wrapper">
                    <input
                      type="text"
                      className="daform-input"
                      id="monthlyIncome"
                      placeholder="Enter your monthly income"
                      value={formData.monthlyIncome}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-5.png"
                      alt="User"
                      className="daform-input-icon"
                    />
                  </div>                  
                </div>                             
                <button
                  type="submit"
                  className="daform-submit-btn"
                  style={{
                    background: `${
                      isSubmitting
                        ? "linear-gradient(to right, #005fff, #33c4ff)"
                        : ""
                    }`,
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    "Check Eligibility"
                  )}
                </button>
              </form>
              {/* -------------------- Form Ends ---------------------- */}
            </article>
            {/* Services Section (visible on mobile below form) */}
            <div className="daform-services">
              <div className="row">
                <div className="col-12">
                  {/* PL Carousel - React implementation */}
                  <div className="pl-carousel-section">
                    <div
                      className="pl-carousel"
                      data-carousel="1"
                      ref={plContainerRef}
                      onMouseEnter={handlePlMouseEnter}
                      onMouseLeave={handlePlMouseLeave}
                    >
                      <div className="pl-carousel-track-container">
                        <div
                          className="pl-carousel-track"
                          ref={plTrackRef}
                          style={getPlTrackStyle()}
                          onTouchStart={onPlTouchStart}
                          onTouchMove={onPlTouchMove}
                          onTouchEnd={onPlTouchEnd}
                        >
                          {plSlides.map((s, idx) => (
                            <div
                              key={idx}
                              className={`pl-card ${s.styleClass} pl-carousel-slide`}
                            >
                              <div className="pl-card-left">
                                <svg
                                  className="pl-icon"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line
                                    x1="12"
                                    y1="16"
                                    x2="12.01"
                                    y2="16"
                                  ></line>
                                </svg>
                                <div className="pl-card-info">
                                  <p className="pl-issuer">{s.issuer}</p>
                                  <h3 className="pl-card-name">{s.name}</h3>
                                </div>
                              </div>

                              <div className="pl-card-middle">
                                <p className="pl-rate-label">Interest Rate</p>
                                <p className="pl-rate-value">{s.rate}</p>
                              </div>

                              <div className="pl-card-right">
                                <p className="pl-amount-value">
                                  {s.amountValue}
                                </p>
                                <p className="pl-amount-label">
                                  {s.amountLabel}
                                </p>
                              </div>
                              <div className="pl-decoration pl-decoration-1"></div>
                              <div className="pl-decoration pl-decoration-2"></div>
                              <div className="pl-decoration pl-decoration-3"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Dots */}
                    <div className="pl-carousel-dots">
                      {plSlides.map((_, idx) => (
                        <button
                          key={idx}
                          className={`pl-dot ${
                            idx === plIndex ? "pl-active" : ""
                          }`}
                          onClick={() => {
                            setPlIndex(idx);
                            // reset autoplay
                            if (plAutoRef.current) {
                              window.clearInterval(plAutoRef.current);
                              plAutoRef.current = window.setInterval(() => {
                                setPlIndex(
                                  (prev) => (prev + 1) % plSlides.length
                                );
                              }, 3000);
                            }
                          }}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Carousel */}
          <div className="col-lg-6 p-0 daform-right-section">
            <div
              id="daformCarousel"
              className="carousel slide daform-carousel"
              data-bs-ride="carousel"
            >
              <div className="carousel-inner h-100">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`carousel-item daform-carousel-item ${
                      currentSlide === index ? "active" : ""
                    }`}
                  >
                    <Image
                      src={slide.img}
                      alt={slide.title}
                      className="daform-carousel-image"
                    />
                    <div className="daform-carousel-overlay">
                      <h2 className="daform-carousel-title">{slide.title}</h2>
                      <div className="daform-carousel-underline"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Carousel Indicators */}
              <div className="daform-carousel-indicators">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={currentSlide === index ? "active" : ""}
                    onClick={() => setCurrentSlide(index)}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withDatasourceCheck()<ContentBlockProps>(EmploymentDetail);
