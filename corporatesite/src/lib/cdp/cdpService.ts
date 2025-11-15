const CDP_CONFIG = {
  BASE_URL: "https://api-engage-ap.sitecorecloud.io/v2.1/guests",
  USERNAME: process.env.NEXT_PUBLIC_CDP_USERNAME, // Sourced from environment
  PASSWORD: process.env.NEXT_PUBLIC_CDP_PASSWORD, // Sourced from environment
};

export type CDPGuestResponse = {
  items: {
    ref: string;
    email?: string; // optional, not always present
    identifiers?: {
      provider: string;
      id: string;
    }[];
  }[];
};

export const CheckGuestExistsInCDP = async (
  idnumber: string
): Promise<CDPGuestResponse> => {
  const query = new URLSearchParams({
    "identifiers.provider": "IDNumber",
    "identifiers.id": idnumber,
    expand: "true",
  }).toString();

  const formattedGuestAPIUrl = `${CDP_CONFIG.BASE_URL}?${query}`;
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  // Fetch the guest information
  const response = await fetch(formattedGuestAPIUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error creating guest");
  }

  // Parse and return the response data
  return response.json();
};

export const AddGuestExtension = async (
  guestRef: string,
  nextPageURL: string,
  journeySelected: string,
) => {
  // Create the guest extension in CDP
  let formattedGuestRef = `${CDP_CONFIG.BASE_URL}/${guestRef}/extensions`;
  formattedGuestRef = formattedGuestRef.replace("{guestRef}", guestRef);
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  // Send the request to create the guest extension
  const response = await fetch(formattedGuestRef, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      name: "ext",
      JourneyStatus: nextPageURL,
      JourneySelected: journeySelected,
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Error adding guest interests: ${JSON.stringify(errorData)}`
    );
  }

  // Parse and return the response data
  return response.json();
};


//------------------- UPDATE GUEST EXTENSION IN CDP -------------------//

export const UpdateGuestExtension = async (
  guestRef: string,
  nextPageURL: string,
  journeySelected: string,
) => {
  // Update (create or overwrite) the guest extension in CDP
  const url = `${CDP_CONFIG.BASE_URL}/${guestRef}/extensions/ext`;
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  // Send the request to update the guest extension
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      JourneyStatus: nextPageURL,
      JourneySelected: journeySelected,
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Error updating guest extension: ${JSON.stringify(errorData)}`
    );
  }

  // Parse and return the response data
  return response.json();
};

export const UpdateGuestExtensionV2 = async (
  guestRef: string,
  nextPageURL: string,
  LoanAmount: string,
) => {
  // Update (create or overwrite) the guest extension in CDP
  const url = `${CDP_CONFIG.BASE_URL}/${guestRef}/extensions/ext`;
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  // Send the request to update the guest extension
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      JourneyStatus: nextPageURL,
      LoanAmount: LoanAmount,
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Error updating guest extension: ${JSON.stringify(errorData)}`
    );
  }

  // Parse and return the response data
  return response.json();
};


export const UpdateGuestExtensionV3 = async (
  guestRef: string,
  nextPageURL: string,
  EmploymentDetail: string,
  BankAccountNumber: string,
) => {
  // Update (create or overwrite) the guest extension in CDP
  const url = `${CDP_CONFIG.BASE_URL}/${guestRef}/extensions/ext`;
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  // Send the request to update the guest extension
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      JourneyStatus: nextPageURL,
      EmploymentDetail: EmploymentDetail,
      BankAccountNumber: BankAccountNumber,
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Error updating guest extension: ${JSON.stringify(errorData)}`
    );
  }

  // Parse and return the response data
  return response.json();
};

export const UpdateGuestExtensionV4 = async (
  guestRef: string,
  nextPageURL: string,
  CreditCard: string,
) => {
  // Update (create or overwrite) the guest extension in CDP
  const url = `${CDP_CONFIG.BASE_URL}/${guestRef}/extensions/ext`;
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  // Send the request to update the guest extension
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      JourneyStatus: nextPageURL,
      CreditCard: CreditCard,
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Error updating guest extension: ${JSON.stringify(errorData)}`
    );
  }

  // Parse and return the response data
  return response.json();
};

export const UpdateGuestExtensionV5 = async (
  guestRef: string,
  nextPageURL: string,
  EmploymentDetail: string,
  Income: string,
) => {
  // Update (create or overwrite) the guest extension in CDP
  const url = `${CDP_CONFIG.BASE_URL}/${guestRef}/extensions/ext`;
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  // Send the request to update the guest extension
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      JourneyStatus: nextPageURL,
      EmploymentDetail: EmploymentDetail,
      Income: Income,
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Error updating guest extension: ${JSON.stringify(errorData)}`
    );
  }

  // Parse and return the response data
  return response.json();
};


export const UpdateGuestExtensionV6 = async (
  guestRef: string,
  nextPageURL: string,  
  Income: string,
  Valuation: string,
) => {
  // Update (create or overwrite) the guest extension in CDP
  const url = `${CDP_CONFIG.BASE_URL}/${guestRef}/extensions/ext`;
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  // Send the request to update the guest extension
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      JourneyStatus: nextPageURL,      
      Income: Income,
      Valuation: Valuation,
    }),
  });

  // Check if the response is successful
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Error updating guest extension: ${JSON.stringify(errorData)}`
    );
  }

  // Parse and return the response data
  return response.json();
};

//------------------- GET GUEST DETAILS FROM CDP -------------------//

export type CDPGuestDetailsResponse = {
  items: {
    ref: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumbers?: string[];    
    identifiers?: {
      provider: string;
      id: string;
    }[];
  }[];
};

// Get full guest details from CDP
export const GetGuestDetails = async (  
  said: string
): Promise<CDPGuestDetailsResponse> => {
  const query = new URLSearchParams({
    'identifiers.provider': 'IDNumber',
    'identifiers.id': said,
    expand: 'true', // ensures details like firstName, lastName are included
  }).toString();

  const formattedGuestAPIUrl = `https://api-engage-ap.sitecorecloud.io/v2.1/guests?${query}`;
  const credentials = btoa(`${CDP_CONFIG.USERNAME}:${CDP_CONFIG.PASSWORD}`);

  const response = await fetch(formattedGuestAPIUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error fetching guest details');
  }

  return response.json();
};
