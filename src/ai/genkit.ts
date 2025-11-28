import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // We use flash for chat and Pro for more complex tasks
  model: 'googleai/gemini-1.5-pro-latest',
});
