export type DecisionOffersResponse = {
  NextPageURL?: string;
  JourneySelected?: string;
  [key: string]: unknown; // fallback for any other attributes
};

export const getNextPageFromExperience = async (
  idNumber: string
): Promise<DecisionOffersResponse> => {
  // Format the guest reference URL
  const formattedGuestRef = `https://api-engage-ap.sitecorecloud.io/v2/callFlows`;
  
  // Call the experience API
  const response = await fetch(formattedGuestRef, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientKey: "6a6f4dca245456208da87c58caf0d3c3",
      channel: "WEB",
      language: "EN",
      currencyCode: "EUR",
      pointOfSale: "demo-site-1",
      identifiers: {
        id: idNumber,
        provider: "IDNumber",
      },
      friendlyId: "lng_journey_demov1",
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Error in getting next page from experience: ${JSON.stringify(errorData)}`
    );
  }

  // Return the response data
  return response.json();
};
