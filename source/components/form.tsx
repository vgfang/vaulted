import React from 'react';
import {Box} from 'ink';
import {FormInput, FormInputType} from './form-input';
import {TEXT_INPUT_WIDTH} from '../utils/constants';

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
	const maxLabelWidth =
		Math.max(...inputs.map(input => input.label.length)) + 2;

	// fixed form width for predictable layout and line wrapping
	const formWidth = maxLabelWidth + TEXT_INPUT_WIDTH;

	return (
		<Box flexDirection="column" alignItems="center" paddingX={2} paddingY={1}>
			<Box width={formWidth} flexDirection="column" alignItems="center">
				{inputs.map((input, index) => (
					<FormInput
						key={input.label}
						{...input}
						selected={selectedIndex === index}
						labelWidth={maxLabelWidth}
						height={input.height}
					/>
				))}
			</Box>
		</Box>
	);
};
