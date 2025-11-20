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
    employmentDetail: "",
    bankAccountNumber: "",
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
          EmploymentDetail: formData.employmentDetail,
          BankAccountNumber: formData.bankAccountNumber,
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
        formData.employmentDetail,
        formData.bankAccountNumber
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
          formData.employmentDetail,
          formData.bankAccountNumber
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
                      id="employmentDetail"
                      placeholder="Enter your employment detail"
                      value={formData.employmentDetail}
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
                      id="bankAccountNumber"
                      placeholder="Enter your bank account number"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                    />
                    <Image
                      src="/journey/images/icon-8.png"
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

export default withDatasourceCheck()<ContentBlockProps>(EmploymentDetail);
