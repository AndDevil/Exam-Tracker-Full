/**
 * Retries an asynchronous function with exponential backoff.
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 100
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    console.warn(`Firestore operation failed. Retrying in ${delay}ms... (Remaining retries: ${retries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};
