import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow use in browser for client-side moderation (use with caution)
});

export const moderationService = {
  async moderateText(text) {
    try {
      const response = await openai.moderations.create({
        input: text,
      });
      const [results] = response.results;
      return results.flagged; // Returns true if content is flagged, false otherwise
    } catch (error) {
      console.error('Error moderating text with OpenAI:', error);
      // Optionally, handle API errors or fall back to a default behavior
      return false; // Default to not flagged on error
    }
  },
  // You can add more moderation functions here, e.g., for images if needed
};
