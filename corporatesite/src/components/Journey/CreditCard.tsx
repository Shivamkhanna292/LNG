"use client";

import { JSX, useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field, withDatasourceCheck } from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import { event } from "@sitecore-cloudsdk/events/browser";
import { CdpHelper, useSitecore } from "@sitecore-content-sdk/nextjs";
import config from "sitecore.config";
import Cookies from "js-cookie";
import {
  CDPGuestDetailsResponse,
  GetGuestDetails,
  UpdateGuestExtensionV4,
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

  // ------------------ FETCH GUEST DETAILS ON LOAD ------------------//
  useEffect(() => {
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
  }, []);
  // ------------------ FETCH GUEST DETAILS ON LOAD ------------------//

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
    <>
      <div className="banner">
        <img src="/journey/images/cc.jpg" alt="Credit Card" />
      </div>
      <div className="form-container">
        <h4 className="form-heading">{fields.Header.value}</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="idNumber" className="form-label">
              ID Number
            </label>
            <input
              type="text"
              className="form-control"
              id="idNumber"
              placeholder="Enter your ID Number"
              value={formData.idNumber}
              onChange={handleChange}
              readOnly
            />
          </div>

          <div className="mb-3">
            <label htmlFor="mobileNumber" className="form-label">
              Mobile Number
            </label>
            <input
              type="tel"
              className="form-control"
              id="mobileNumber"
              placeholder="Enter your Mobile Number"
              value={formData.mobileNumber}
              onChange={handleChange}
              readOnly
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your Email"
              value={formData.email}
              onChange={handleChange}
              readOnly
            />
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              placeholder="Enter your Name"
              value={formData.name}
              onChange={handleChange}
              readOnly
            />
          </div>

          <div className="mb-5">
            <label htmlFor="creditCard" className="form-label">
              Choose Card
            </label>
            <select
              className="form-select"
              id="creditCard"
              value={formData.creditCard}
              onChange={handleChange}
              required
            >
              <option selected disabled>
                Choose an option
              </option>
              <option value="Visa">Visa</option>
              <option value="RuPay">RuPay</option>
              <option value="MasterCard">MasterCard</option>
            </select>
          </div>

          <div className="text-center">
            <button
              type="submit"
              className={`btn btn-primary px-5 ${
                isSubmitting ? "is-loading" : ""
              }`}
              disabled={isSubmitting}
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default withDatasourceCheck()<ContentBlockProps>(CreditCard);
