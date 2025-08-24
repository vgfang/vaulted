import {MIN_NAME_LENGTH, PASSWORD_MIN_LENGTH} from './constants';

export const dummyValidator = (value: string) => {
	return {valid: true};
};

export const nameValidator = (value: string) => {
	if (value.length < MIN_NAME_LENGTH) {
		return {valid: false, error: 'Name must be at least 3 characters long'};
	}
	return {valid: true};
};

export const passwordValidator = (value: string) => {
	if (value.length < PASSWORD_MIN_LENGTH) {
		return {valid: false, error: 'Password must be at least 8 characters long'};
	}
	return {valid: true};
};
