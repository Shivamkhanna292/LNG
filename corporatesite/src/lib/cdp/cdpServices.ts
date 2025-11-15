interface UpdateGuestExtensionPayload {
  grossIncome?: string;
  loanAmount?: string;
  loanTerm?: string;
  loanReason?: string;
  employmentType?: string;
  accountNumber?: string;
  LastPage: string; // Default fields - always sent as "waiting"
  RiskDecision: string; // Default fields - always sent as "waiting"
  DecisionScore: string; // Default fields - always sent as "waiting"
  RiskGrade: string; // Default fields - always sent as "waiting"
  NextPageURLConnect?: string;
}

export const updateGuestExtensionInCDPV2 = async (credentials: string, guestRef: string) => {
  if (!guestRef) {
    throw new Error('guestRef is required.');
  }

  // Merge provided data with the four default "waiting" properties
  const finalPayload: UpdateGuestExtensionPayload = {
    LastPage: 'ContactDetails',
    RiskDecision: 'waiting',
    DecisionScore: 'waiting',
    RiskGrade: 'waiting',
    NextPageURLConnect: '',
  };

  const url = `https://api-engage-ap.sitecorecloud.io/v2.1/guests/${guestRef}/extensions/ext`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(finalPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error updating guest extension: ${JSON.stringify(errorData)}`);
  }

  return response.json();
};
