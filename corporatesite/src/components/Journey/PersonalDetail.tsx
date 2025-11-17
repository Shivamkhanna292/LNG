"use client";

import { JSX, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, withDatasourceCheck } from "@sitecore-content-sdk/nextjs";
import { ComponentProps } from "lib/component-props";
import { event, identity } from "@sitecore-cloudsdk/events/browser";
import { CdpHelper, useSitecore } from "@sitecore-content-sdk/nextjs";
import config from "sitecore.config";
import Cookies from "js-cookie";
import {
  AddGuestExtension,
  CDPGuestResponse,
  CheckGuestExistsInCDP,
  UpdateGuestExtension,
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

const PersonalDetail = ({ fields }: ContentBlockProps): JSX.Element => {
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

    // Identify Customer
    try {
      const identityResponse = await identity({
        channel: "WEB",
        currency: "USD",
        firstName: formData.name,
        lastName: "",
        email: formData.email,
        phone: formData.mobileNumber,
        identifiers: [
          {
            provider: "IDNumber",
            id: formData.idNumber,
          },
          {
            provider: "Mobile",
            id: formData.mobileNumber,
          },
        ],
      }).catch((e) => console.debug(e));
      console.log("Personal Detail - Identity Response:", identityResponse);
    } catch (err) {
      console.error("Personal Detail - Error in identity:", err);
    }

    // Get Guest Ref from Identified Customer
    let guestRef: string | undefined;
    try {
      let guestResponse: CDPGuestResponse | null = null;
      guestResponse = await CheckGuestExistsInCDP(formData.idNumber);
      console.log(
        "Personal Detail - Identified Guest Response:",
        guestResponse
      );
      if (guestResponse && guestResponse.items.length > 0) {
        const guest = guestResponse.items[0];
        guestRef = guest.ref;
      }
    } catch (err) {
      console.error(
        "Personal Detail - Error In Identified Guest Response:",
        err
      );
    }

    // Set Cookies
    Cookies.set("CDP_Guest_Ref", guestRef ?? "", { expires: 365, path: "/" });
    Cookies.set("CDP_Guest_IdNumber", formData.idNumber, {
      expires: 365,
      path: "/",
    });

    // Log Event
    try {
      await event({
        type: "PersonalDetail",
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
        },
      });
    } catch (err) {
      console.error("Personal Detail - Error sending event to CDP:", err);
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
          "Personal Detail - NextPageURL missing from experience response"
        );
        return;
      }

      if (!journeySelected) {
        console.warn(
          "Personal Detail - JourneySelected missing from experience response"
        );
        return;
      }

      console.log("Personal Detail - NextPageURL:", nextPageURL);
      console.log("Personal Detail - JourneySelected:", journeySelected);

      // 👉 Update guest in CDP
      try {
        const response = await AddGuestExtension(
          guestRef ?? "",
          "personal-detail",
          journeySelected
        );
        console.log(
          "Personal Detail - Guest successfully added in CDP: ",
          response
        );
      } catch (err) {
        console.error("Personal Detail - Error Adding guest data in CDP:", err);

        try {
          const response = await UpdateGuestExtension(
            guestRef ?? "",
            "personal-detail",
            journeySelected
          );
          console.log(
            "Personal Detail - Guest successfully updated in CDP: ",
            response
          );
        } catch (innerErr) {
          console.error(
            "Personal Detail - Error in updating guest data in CDP:",
            innerErr
          );
        }
      }

      // 👉 Redirect to next page
      router.push(`/demo/${nextPageURL.replace(/^\/+/, "")}`);
    } catch (err) {
      console.error("Personal Detail - Error in Experience Call:", err);
    }

    setIsSubmitting(false);
  };

  return (
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
            required
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
            required
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
            required
          />
        </div>

        <div className="mb-5">
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
            required
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
  );
};

export default withDatasourceCheck()<ContentBlockProps>(PersonalDetail);
