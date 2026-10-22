// Simulated API layer with delay to mimic real network responses
export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockFetch = async (data, shouldFail = false, failureMessage = 'Request failed') => {
  await delay(250);
  if (shouldFail) {
    throw new Error(failureMessage);
  }
  return { success: true, data };
};
