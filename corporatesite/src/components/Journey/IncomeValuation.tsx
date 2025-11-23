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
  UpdateGuestExtensionV6,
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

const IncomeDetail = ({ fields }: ContentBlockProps): JSX.Element => {
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
    totalExperienceYears: "",
    experienceInCurrentCompanyYears: "",
    monthlyGrossSalary: "",
    monthlyNetSalary: ""
  });

  const slides = [
    {
      img: "/journey/images/hl-slider-1.jpg",
      title: "Home Loan Guidance for Every Credit Profile",
    },
    {
      img: "/journey/images/hl-slider-2.jpg",
      title: "Home Loan Solutions Tailored for You",
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
        type: "IncomeValuation",
        channel: "WEB",
        currency: "USD",
        page: page.layout.sitecore.route?.name,
        pageVariantId,
        language,
        payload: {
          totalExperienceYears: formData.totalExperienceYears,
          experienceInCurrentCompanyYears: formData.experienceInCurrentCompanyYears,
          monthlyGrossSalary: formData.monthlyGrossSalary,
          monthlyNetSalary: formData.monthlyNetSalary,
        },
      });
    } catch (err) {
      console.error("Income Valuation - Error sending event to CDP:", err);
    }

    const guestRef = Cookies.get("CDP_Guest_Ref");
    const guestIdNumber = Cookies.get("CDP_Guest_IdNumber");

    // 👉 Update guest in CDP
    try {
      const response = await UpdateGuestExtensionV6(
        guestRef ?? "",
        "income-valuation",
        formData.monthlyNetSalary,
        formData.monthlyGrossSalary
      );
      console.log(
        "Income Valuation - Guest successfully updated in CDP: ",
        response
      );
    } catch (innerErr) {
      console.error(
        "Income Valuation - Error in updating guest data in CDP:",
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
          "Income Valuation - NextPageURL missing from experience response"
        );
        return;
      }

      if (!journeySelected) {
        console.warn(
          "Income Valuation - JourneySelected missing from experience response"
        );
        return;
      }

      console.log("Income Valuation - NextPageURL:", nextPageURL);
      console.log("Income Valuation - JourneySelected:", journeySelected);

      // 👉 Update guest in CDP
      try {
        const response = await UpdateGuestExtensionV6(
          guestRef ?? "",
          nextPageURL,
          formData.monthlyNetSalary,
          formData.monthlyGrossSalary
        );
        console.log(
          "Income Valuation - Guest successfully updated in CDP: ",
          response
        );
      } catch (innerErr) {
        console.error(
          "Income Valuation - Error in updating guest data in CDP:",
          innerErr
        );
      }

      // 👉 Redirect to next page
      router.push(`/demo/${nextPageURL.replace(/^\/+/, "")}`);
    } catch (err) {
      console.error("Income Valuation - Error in Experience Call:", err);
    }

    setIsSubmitting(false);
  };

 // -------------------------
  // HL Carousel (React-only)
  // -------------------------
  const hlSlides = [
    {
      issuer: "Premier Lending",
      name: "Starter Home Loan",
      rateValue: "5.99%",
      rateLabel: "Interest Rate",
      amountValue: "Up to $500K",
      amountLabel: "Loan Amount",
      styleClass: "hl-card-purple",
    },
    {
      issuer: "City Home Finance",
      name: "Easy Approval",
      rateValue: "6.25%",
      rateLabel: "Interest Rate",
      amountValue: "5% Down",
      amountLabel: "Low Down Payment",
      styleClass: "hl-card-pink",
    },
    {
      issuer: "Metro Mortgage",
      name: "FHA Special",
      rateValue: "5.75%",
      rateLabel: "Interest Rate",
      amountValue: "3.5% Down",
      amountLabel: "FHA Qualified",
      styleClass: "hl-card-orange",
    },
  ];

  const [hlIndex, setHlIndex] = useState(0);
  const hlTrackRef = useRef<HTMLDivElement | null>(null);
  const hlContainerRef = useRef<HTMLDivElement | null>(null);
  const [hlSlideWidth, setHlSlideWidth] = useState(0);
  const hlAutoRef = useRef<number | null>(null);

  // touch/swipe refs
  const hlTouchStartX = useRef(0);
  const hlTouchCurrentX = useRef(0);
  const hlIsDragging = useRef(false);

  // compute slide width
  useEffect(() => {
    const updateWidth = () => {
      const firstSlide = hlTrackRef.current?.children?.[0] as
        | HTMLElement
        | undefined;
      if (firstSlide) {
        setHlSlideWidth(firstSlide.getBoundingClientRect().width);
      } else {
        setHlSlideWidth(0);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // apply transform
  const getHlTrackStyle = () => {
    const translate = hlIndex * hlSlideWidth;
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
      hlAutoRef.current = window.setInterval(() => {
        setHlIndex((prev) => (prev + 1) % hlSlides.length);
      }, 3000);
    };

    const stopAuto = () => {
      if (hlAutoRef.current) {
        window.clearInterval(hlAutoRef.current);
        hlAutoRef.current = null;
      }
    };

    startAuto();
    return () => stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hlSlideWidth]);

  // pause on hover
  const handleHlMouseEnter = () => {
    if (hlAutoRef.current) {
      window.clearInterval(hlAutoRef.current);
      hlAutoRef.current = null;
    }
  };

  const handleHlMouseLeave = () => {
    if (!hlAutoRef.current) {
      hlAutoRef.current = window.setInterval(() => {
        setHlIndex((prev) => (prev + 1) % hlSlides.length);
      }, 3000);
    }
  };

  // touch support
  const onHlTouchStart = (e: React.TouchEvent) => {
    hlTouchStartX.current = e.touches[0].clientX;
    hlTouchCurrentX.current = hlTouchStartX.current;
    hlIsDragging.current = true;
    if (hlAutoRef.current) {
      window.clearInterval(hlAutoRef.current);
      hlAutoRef.current = null;
    }
  };

  const onHlTouchMove = (e: React.TouchEvent) => {
    if (!hlIsDragging.current) return;
    hlTouchCurrentX.current = e.touches[0].clientX;
  };

  const onHlTouchEnd = () => {
    if (!hlIsDragging.current) return;
    hlIsDragging.current = false;

    const diff = hlTouchStartX.current - hlTouchCurrentX.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setHlIndex((prev) => (prev + 1) % hlSlides.length);
      } else {
        setHlIndex((prev) => (prev - 1 + hlSlides.length) % hlSlides.length);
      }
    }

    // restart autoplay
    if (!hlAutoRef.current) {
      hlAutoRef.current = window.setInterval(() => {
        setHlIndex((prev) => (prev + 1) % hlSlides.length);
      }, 3000);
    }
  };

  return (
    <div className="daform-wrapper hl-bg">
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
                      id="totalExperienceYears"
                      placeholder="Enter your total experience (years)"
                      value={formData.totalExperienceYears}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-1.png"
                      alt="User"
                      className="daform-input-icon"
                    />
                  </div>
                  <div className="daform-error-message">
                    Please enter your full name (at least 3 characters)
                  </div>
                </div>      
                <div className="daform-form-group">
                  <div className="daform-input-wrapper">
                    <input
                      type="text"
                      className="daform-input"
                      autoFocus
                      id="experienceInCurrentCompanyYears"
                      placeholder="Enter experience in current company (years)"
                      value={formData.experienceInCurrentCompanyYears}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-1.png"
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
                      autoFocus
                      id="monthlyGrossSalary"
                      placeholder="Enter your monthly gross salary"
                      value={formData.monthlyGrossSalary}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-5.png"
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
                      autoFocus
                      id="monthlyNetSalary"
                      placeholder="Enter your monthly net salary"
                      value={formData.monthlyNetSalary}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-5.png"
                      alt="ID"
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
                  {/* HL Carousel - React version */}
                  <div className="hl-carousel-section">
                    <div
                      className="hl-carousel"
                      data-carousel="1"
                      ref={hlContainerRef}
                      onMouseEnter={handleHlMouseEnter}
                      onMouseLeave={handleHlMouseLeave}
                    >
                      <div className="hl-carousel-track-container">
                        <div
                          className="hl-carousel-track"
                          ref={hlTrackRef}
                          style={getHlTrackStyle()}
                          onTouchStart={onHlTouchStart}
                          onTouchMove={onHlTouchMove}
                          onTouchEnd={onHlTouchEnd}
                        >
                          {hlSlides.map((s, idx) => (
                            <div
                              key={idx}
                              className={`hl-card ${s.styleClass} hl-carousel-slide`}
                            >
                              {/* LEFT */}
                              <div className="hl-card-left">
                                <svg
                                  className="hl-icon"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>

                                <div className="hl-card-info">
                                  <p className="hl-issuer">{s.issuer}</p>
                                  <h3 className="hl-card-name">{s.name}</h3>
                                </div>
                              </div>

                              {/* MIDDLE */}
                              <div className="hl-card-middle">
                                <p className="hl-rate-label">{s.rateLabel}</p>
                                <p className="hl-rate-value">{s.rateValue}</p>
                              </div>

                              {/* RIGHT */}
                              <div className="hl-card-right">
                                <p className="hl-amount-value">
                                  {s.amountValue}
                                </p>
                                <p className="hl-amount-label">
                                  {s.amountLabel}
                                </p>
                              </div>

                              {/* DECORATIONS */}
                              <div className="hl-decoration hl-decoration-1"></div>
                              <div className="hl-decoration hl-decoration-2"></div>
                              <div className="hl-decoration hl-decoration-3"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dots */}
                    <div className="hl-carousel-dots">
                      {hlSlides.map((_, idx) => (
                        <button
                          key={idx}
                          className={`hl-dot ${
                            idx === hlIndex ? "hl-active" : ""
                          }`}
                          onClick={() => {
                            setHlIndex(idx);
                            if (hlAutoRef.current) {
                              window.clearInterval(hlAutoRef.current);
                              hlAutoRef.current = window.setInterval(() => {
                                setHlIndex((p) => (p + 1) % hlSlides.length);
                              }, 3000);
                            }
                          }}
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

export default withDatasourceCheck()<ContentBlockProps>(IncomeDetail);