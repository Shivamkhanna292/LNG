"use client";

import {
  JSX,
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Field, withDatasourceCheck } from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import { event } from "@sitecore-cloudsdk/events/browser";
import { CdpHelper, useSitecore } from "@sitecore-content-sdk/nextjs";
import config from "sitecore.config";
import Cookies from "js-cookie";
import { UpdateGuestExtensionV5 } from "../../lib/cdp/cdpService";
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
    employmentType: "",
    annualIncome: "",
    designation: "",
  });

  const slides = [
    {
      img: "/journey/images/cc-slider-1.jpg",
      title: "Credit Card Guidance for Every Credit Profile",
    },
    {
      img: "/journey/images/cc-slider-2.jpg",
      title: "Credit Card Solutions Tailored for You",
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
        type: "IncomeDetail",
        channel: "WEB",
        currency: "USD",
        page: page.layout.sitecore.route?.name,
        pageVariantId,
        language,
        payload: {
          employmentType: formData.employmentType,
          annualIncome: formData.annualIncome,
          designation: formData.designation,
        },
      });
    } catch (err) {
      console.error("Income Detail - Error sending event to CDP:", err);
    }

    const guestRef = Cookies.get("CDP_Guest_Ref");
    const guestIdNumber = Cookies.get("CDP_Guest_IdNumber");

    // 👉 Update guest in CDP
    try {
      const response = await UpdateGuestExtensionV5(
        guestRef ?? "",
        "income-detail",
        formData.employmentType,
        formData.annualIncome
      );
      console.log(
        "Income Detail - Guest successfully updated in CDP: ",
        response
      );
    } catch (innerErr) {
      console.error(
        "Income Detail - Error in updating guest data in CDP:",
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
          "Income Detail - NextPageURL missing from experience response"
        );
        return;
      }

      if (!journeySelected) {
        console.warn(
          "Income Detail - JourneySelected missing from experience response"
        );
        return;
      }

      console.log("Income Detail - NextPageURL:", nextPageURL);
      console.log("Income Detail - JourneySelected:", journeySelected);

      // 👉 Update guest in CDP
      try {
        const response = await UpdateGuestExtensionV5(
          guestRef ?? "",
          nextPageURL,
          formData.employmentType,
          formData.annualIncome
        );
        console.log(
          "Income Detail - Guest successfully updated in CDP: ",
          response
        );
      } catch (innerErr) {
        console.error(
          "Income Detail - Error in updating guest data in CDP:",
          innerErr
        );
      }

      // 👉 Redirect to next page
      router.push(`/demo/${nextPageURL.replace(/^\/+/, "")}`);
    } catch (err) {
      console.error("Income Detail - Error in Experience Call:", err);
    }

    setIsSubmitting(false);
  };

  // -------------------------
  // CL Carousel (React-only)
  // -------------------------
  const ccSlides = [
    {
      issuer: "Premier Bank",
      name: "Platinum Rewards",
      earnValue: "3%",
      earnLabel: "Earn",
      bonusValue: "$200 Bonus",
      bonusLabel: "Welcome Offer",
      styleClass: "cc-card-purple",
    },
    {
      issuer: "City Credit Union",
      name: "Cash Plus",
      earnValue: "2%",
      earnLabel: "Earn",
      bonusValue: "$150 Bonus",
      bonusLabel: "Welcome Offer",
      styleClass: "cc-card-pink",
    },
    {
      issuer: "Metro Bank",
      name: "Cash Master",
      earnValue: "1.5%",
      earnLabel: "Earn",
      bonusValue: "$100 Bonus",
      bonusLabel: "Welcome Offer",
      styleClass: "cc-card-orange",
    },
  ];

  // -------------------------
  // CC Carousel (React-only)
  // -------------------------
  const [ccIndex, setCcIndex] = useState(0);
  const ccTrackRef = useRef<HTMLDivElement | null>(null);
  const ccContainerRef = useRef<HTMLDivElement | null>(null);
  const [ccSlideWidth, setCcSlideWidth] = useState(0);
  const ccAutoRef = useRef<number | null>(null);

  // touch/swipe refs
  const ccTouchStartX = useRef(0);
  const ccTouchCurrentX = useRef(0);
  const ccIsDragging = useRef(false);

  // compute slide width
  useEffect(() => {
    const updateWidth = () => {
      const firstSlide = ccTrackRef.current?.children?.[0] as
        | HTMLElement
        | undefined;
      if (firstSlide) {
        const w = firstSlide.getBoundingClientRect().width;
        setCcSlideWidth(w);
      } else {
        setCcSlideWidth(0);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // track transform style
  const getCcTrackStyle = () => {
    const translate = ccIndex * ccSlideWidth;
    return {
      transform: `translateX(-${translate}px)`,
      transition: "transform 450ms ease",
      willChange: "transform",
      display: "flex",
    } as React.CSSProperties;
  };

  // autoplay
  useEffect(() => {
    const startAuto = () => {
      stopAuto();
      ccAutoRef.current = window.setInterval(() => {
        setCcIndex((prev) => (prev + 1) % ccSlides.length);
      }, 3000);
    };

    const stopAuto = () => {
      if (ccAutoRef.current) {
        window.clearInterval(ccAutoRef.current);
        ccAutoRef.current = null;
      }
    };

    startAuto();
    return () => stopAuto();
  }, [ccSlideWidth]);

  // pause on hover
  const handleCcMouseEnter = () => {
    if (ccAutoRef.current) {
      window.clearInterval(ccAutoRef.current);
      ccAutoRef.current = null;
    }
  };
  const handleCcMouseLeave = () => {
    if (!ccAutoRef.current) {
      ccAutoRef.current = window.setInterval(() => {
        setCcIndex((prev) => (prev + 1) % ccSlides.length);
      }, 3000);
    }
  };

  // touch handlers
  const onCcTouchStart = (e: React.TouchEvent) => {
    ccTouchStartX.current = e.touches[0].clientX;
    ccTouchCurrentX.current = ccTouchStartX.current;
    ccIsDragging.current = true;

    if (ccAutoRef.current) {
      window.clearInterval(ccAutoRef.current);
      ccAutoRef.current = null;
    }
  };

  const onCcTouchMove = (e: React.TouchEvent) => {
    if (!ccIsDragging.current) return;
    ccTouchCurrentX.current = e.touches[0].clientX;
  };

  const onCcTouchEnd = () => {
    if (!ccIsDragging.current) return;
    ccIsDragging.current = false;

    const diff = ccTouchStartX.current - ccTouchCurrentX.current;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCcIndex((prev) => (prev + 1) % ccSlides.length); // next
      } else {
        setCcIndex((prev) => (prev - 1 + ccSlides.length) % ccSlides.length); // prev
      }
    }

    // restart autoplay
    if (!ccAutoRef.current) {
      ccAutoRef.current = window.setInterval(() => {
        setCcIndex((prev) => (prev + 1) % ccSlides.length);
      }, 3000);
    }
  };

  return (
    <div className="daform-wrapper cc-bg">
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
                      id="employmentType"
                      placeholder="Enter your employment type"
                      value={formData.employmentType}
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
                      id="annualIncome"
                      placeholder="Enter your annual income"
                      value={formData.annualIncome}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-5.png"
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
                      id="designation"
                      placeholder="Enter your designation"
                      value={formData.designation}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-2.png"
                      alt="User"
                      className="daform-input-icon"
                    />
                  </div>
                  <div className="daform-error-message">
                    Please enter your full name (at least 3 characters)
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
                  <div className="cc-carousel-section">
                    <div
                      className="cc-carousel"
                      ref={ccContainerRef}
                      onMouseEnter={handleCcMouseEnter}
                      onMouseLeave={handleCcMouseLeave}
                    >
                      <div className="cc-carousel-track-container">
                        <div
                          className="cc-carousel-track"
                          ref={ccTrackRef}
                          style={getCcTrackStyle()}
                          onTouchStart={onCcTouchStart}
                          onTouchMove={onCcTouchMove}
                          onTouchEnd={onCcTouchEnd}
                        >
                          {ccSlides.map((s, idx) => (
                            <div
                              key={idx}
                              className={`cc-card ${s.styleClass} cc-carousel-slide`}
                            >
                              <div className="cc-card-left">
                                <svg
                                  className="cc-icon"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="1"
                                    y="4"
                                    width="22"
                                    height="16"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                                <div className="cc-card-info">
                                  <p className="cc-issuer">{s.issuer}</p>
                                  <h3 className="cc-card-name">{s.name}</h3>
                                </div>
                              </div>

                              <div className="cc-card-middle">
                                <p className="cc-earn-label">{s.earnLabel}</p>
                                <p className="cc-earn-value">{s.earnValue}</p>
                              </div>

                              <div className="cc-card-right">
                                <p className="cc-bonus-value">{s.bonusValue}</p>
                                <p className="cc-bonus-label">{s.bonusLabel}</p>
                              </div>

                              <div className="cc-decoration cc-decoration-1"></div>
                              <div className="cc-decoration cc-decoration-2"></div>
                              <div className="cc-decoration cc-decoration-3"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dots */}
                    <div className="cc-carousel-dots">
                      {ccSlides.map((_, idx) => (
                        <button
                          key={idx}
                          className={`cc-dot ${
                            idx === ccIndex ? "cc-active" : ""
                          }`}
                          onClick={() => {
                            setCcIndex(idx);
                            // reset autoplay
                            if (ccAutoRef.current) {
                              window.clearInterval(ccAutoRef.current);
                              ccAutoRef.current = window.setInterval(() => {
                                setCcIndex(
                                  (prev) => (prev + 1) % ccSlides.length
                                );
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
