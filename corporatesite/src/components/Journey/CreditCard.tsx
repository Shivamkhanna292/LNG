"use client";

import { JSX, useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Field, withDatasourceCheck } from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import { event } from "@sitecore-cloudsdk/events/browser";
import { CdpHelper, useSitecore } from "@sitecore-content-sdk/nextjs";
import config from "sitecore.config";
import Cookies from "js-cookie";
import {
  UpdateGuestExtensionV4,
  GetGuestDetails,
  CDPGuestDetailsResponse,
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

const CreditCard = ({ fields }: ContentBlockProps): JSX.Element => {
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
    idNumber: "",
    mobileNumber: "",
    email: "",
    name: "",
    creditCard: "",
  });

  const slides = [
    {
      img: "/journey/images/slider-1.jpg",
      title: "Home Loan Guidance for Every Credit Profile",
    },
    {
      img: "/journey/images/slider-3.jpg",
      title: "Personal Loan Solutions Tailored for You",
    },
    {
      img: "/journey/images/slider-2.jpg",
      title: "Smart Credit Card Options for Better Living",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    const fetchGuestDetails = async () => {
      const guestIdNumber = Cookies.get("CDP_Guest_IdNumber");

      try {
        if (guestIdNumber && guestIdNumber.length > 0) {
          const guestDetails: CDPGuestDetailsResponse = await GetGuestDetails(
            guestIdNumber
          );

          if (guestDetails && guestDetails.items.length > 0) {
            const guest = guestDetails.items[0];
            console.log("Credit Card - Fetched Guest:", guest);

            setFormData((prev) => ({
              ...prev,
              name: guest.firstName || prev.name,
              mobileNumber: guest.phoneNumbers?.[0] || prev.mobileNumber,
              email: guest.email || prev.email,
              idNumber:
                guest.identifiers?.find((id) => id.provider === "IDNumber")
                  ?.id || prev.idNumber,
            }));
          }
        }
      } catch (err) {
        console.error(
          "Credit Card - Error fetching guest details on load:",
          err
        );
      }
    };

    fetchGuestDetails();

    return () => clearInterval(interval);
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    // You can handle API call or navigation here

    setIsSubmitting(true);

    // Log Event
    try {
      await event({
        type: "CreditCard",
        channel: "WEB",
        currency: "USD",
        page: page.layout.sitecore.route?.name,
        pageVariantId,
        language,
        payload: {
          Name: formData.name,
          IDNumber: formData.idNumber,
          Mobile: formData.mobileNumber,
          Email: formData.email,
          CreditCard: formData.creditCard,
        },
      });
    } catch (err) {
      console.error("Credit Card - Error sending event to CDP:", err);
    }

    const guestRef = Cookies.get("CDP_Guest_Ref");

    // 👉 Update guest in CDP
    try {
      const response = await UpdateGuestExtensionV4(
        guestRef ?? "",
        "credit-card",
        formData.creditCard
      );
      console.log(
        "Credit Card - Guest successfully updated in CDP: ",
        response
      );
    } catch (innerErr) {
      console.error(
        "Credit Card - Error in updating guest data in CDP:",
        innerErr
      );
    }

    // 👉 Call Experience
    try {
      let experienceResponse: DecisionOffersResponse | null = null;
      experienceResponse = await getNextPageFromExperience(formData.idNumber);

      const nextPageURL = experienceResponse?.NextPageURL?.trim();
      const journeySelected = experienceResponse?.JourneySelected?.trim();

      // Validate
      if (!nextPageURL) {
        console.warn(
          "Credit Card - NextPageURL missing from experience response"
        );
        return;
      }

      if (!journeySelected) {
        console.warn(
          "Credit Card - JourneySelected missing from experience response"
        );
        return;
      }

      console.log("Credit Card - NextPageURL:", nextPageURL);
      console.log("Credit Card - JourneySelected:", journeySelected);

      // 👉 Redirect to next page
      router.push(`/demo/${nextPageURL.replace(/^\/+/, "")}`);
    } catch (err) {
      console.error("Credit Card - Error in Experience Call:", err);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="daform-wrapper">
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
                      id="idNumber"
                      placeholder="Please enter your ID Number"
                      value={formData.idNumber}
                      onChange={handleChange}
                      readOnly
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
                      placeholder="Please enter your full name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      readOnly
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
                <div className="daform-form-group">
                  <div className="daform-input-wrapper">
                    <input
                      type="tel"
                      className="daform-input"
                      placeholder="Please enter your mobile number"
                      id="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      readOnly
                    />
                    <Image
                      src="/journey/images/icon-3.png"
                      alt="Phone"
                      className="daform-input-icon"
                    />
                  </div>
                </div>
                <div className="daform-form-group">
                  <div className="daform-input-wrapper">
                    <input
                      type="email"
                      className="daform-input"
                      placeholder="Please enter your email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      readOnly
                    />
                    <Image
                      src="/journey/images/icon-4.png"
                      alt="Email"
                      className="daform-input-icon"
                    />
                  </div>
                </div>
                <div className="daform-form-group">
                  <div className="daform-input-wrapper">
                    <select
                      className="daform-select"
                      id="creditCard"
                      value={formData.creditCard}
                      onChange={handleChange}
                      required
                    >
                      <option selected disabled>
                        Choose a card type
                      </option>
                      <option value="Visa">Visa</option>
                      <option value="RuPay">RuPay</option>
                      <option value="MasterCard">MasterCard</option>
                    </select>
                    <Image
                      src="/journey/images/icon-4.png"
                      alt="Credit Card"
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
                <div className="col-4">
                  <div className="daform-service-card">
                    <div className="daform-service-icon-wrapper daform-bg-blue">
                      <Image
                        src="/journey/images/icon-service-1.png"
                        alt="Personal Loan"
                        className="daform-service-icon"
                      />
                    </div>
                    <div className="daform-service-title">Personal Loan</div>
                    <div className="daform-service-subtitle">
                      Credit Score 750+
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="daform-service-card">
                    <div className="daform-service-icon-wrapper daform-bg-green">
                      <Image
                        src="/journey/images/icon-service-2.png"
                        alt="Credit Card"
                        className="daform-service-icon"
                      />
                    </div>
                    <div className="daform-service-title">Credit Card</div>
                    <div className="daform-service-subtitle">
                      Credit Score 600-750
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="daform-service-card">
                    <div className="daform-service-icon-wrapper daform-bg-orange">
                      <Image
                        src="/journey/images/icon-service-3.png"
                        alt="Home Loan"
                        className="daform-service-icon"
                      />
                    </div>
                    <div className="daform-service-title">Home Loan</div>
                    <div className="daform-service-subtitle">
                      Credit Score Below 600
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

export default withDatasourceCheck()<ContentBlockProps>(CreditCard);
