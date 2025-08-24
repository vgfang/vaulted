import React from 'react';
import {Box} from 'ink';
import {FormInput, FormInputType} from './form-input';
import {useScreen} from '../hooks/screen-context';

export interface FormInput {
	label: string;
	type: FormInputType;
	value: string;
	placeholder?: string;
	// this is when the user presses enter on the input to enable
	onEdit?: () => void;
	// try to change the value of the input, will run validator
	attemptChange?: (value: string) => {valid: boolean; error?: string};
	// validate the value of the input
	validate?: (value: string) => {valid: boolean; error?: string};
	height?: number;
}

export const Form = ({
	inputs,
	selectedIndex,
}: {
	inputs: FormInput[];
	selectedIndex: number;
}) => {
	const {cols} = useScreen();

	const maxLabelWidth =
		Math.max(...inputs.map(input => input.label.length)) + 2;

	// dynamic form width based on screen size, avoiding constants
	const formWidth = Math.min(cols - 8, Math.max(cols * 0.8, 60));

	return (
		<Box flexDirection="column" alignItems="center" paddingX={2} paddingY={1}>
			{inputs.map((input, index) => (
				<FormInput
					key={input.label}
					{...input}
					selected={selectedIndex === index}
					labelWidth={maxLabelWidth}
					formWidth={formWidth}
					height={input.height}
				/>
			))}
		</Box>
	);
};
