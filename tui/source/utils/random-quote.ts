import {randomInt} from 'crypto';
import quotes from './quotes.json' with {type: 'json'};

export const randomQuote = (): string => {
	const randomIndex = randomInt(0, quotes.length);
	return quotes[randomIndex] ?? '';
};
