"use client";

import { JSX, useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field, withDatasourceCheck } from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import { event } from "@sitecore-cloudsdk/events/browser";
import { CdpHelper, useSitecore } from "@sitecore-content-sdk/nextjs";
import config from "sitecore.config";
import Cookies from "js-cookie";
import { UpdateGuestExtensionV3 } from "../../lib/cdp/cdpService";
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
    <>
      <div className="banner">
        <img src="/journey/images/pl.jpg" alt="Personal loan" />
      </div>
      <div className="form-container">
        <h4 className="form-heading">{fields.Header.value}</h4>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="employmentDetail" className="form-label">
              Employment Detail
            </label>
            <input
              type="text"
              className="form-control"
              id="employmentDetail"
              placeholder="Enter your Employment Detail"
              value={formData.employmentDetail}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="bankAccountNumber" className="form-label">
              Bank Account Number
            </label>
            <input
              type="tel"
              className="form-control"
              id="bankAccountNumber"
              placeholder="Enter your Bank Account Number"
              value={formData.bankAccountNumber}
              onChange={handleChange}
            />
          </div>

          <div className="text-center">
            <button
              type="submit"
              className={`btn btn-primary px-5 submit-btn`}
              disabled={isSubmitting}
            >
              <span className="btn-text">Next</span>
              <span className={`loader ${isSubmitting ? "" : "d-none"}`}></span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default withDatasourceCheck()<ContentBlockProps>(EmploymentDetail);
