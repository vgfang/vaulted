import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors.js';

type FormInputProps = {
	label: string;
	type: FormInputType;
	value: string;
	selected: boolean;
	placeholder?: string;
	labelWidth?: number;
	height?: number;
};

export enum FormInputType {
	CHECKBOX,
	TEXT,
	PASSWORD,
}

export enum CheckboxState {
	CHECKED = 'checked',
	UNCHECKED = 'unchecked',
}

const hidePassword = (password: string) => {
	return '*'.repeat(password.length);
};

export const FormInput = ({
	label,
	type,
	value,
	placeholder = '',
	selected = false,
	labelWidth = 20,
	height = 1,
}: FormInputProps) => {
	// pad the label to the specified width
	const paddedLabel = `${label}:`.padEnd(labelWidth);

	// use exactly 32 characters for input width for consistent layout
	const valueWidth = 32;

	// calculate dynamic height based on content length
	const calculateHeight = () => {
		if (value) {
			const contentToDisplay =
				type === FormInputType.PASSWORD ? hidePassword(value) : value;
			const lines = Math.ceil(contentToDisplay.length / valueWidth) || 1;
			return Math.max(height, lines);
		}
		return height;
	};

	const dynamicHeight = calculateHeight();

	return (
		<Box
			width={labelWidth + valueWidth}
			flexDirection="row"
			height={dynamicHeight}
			paddingY={0}
		>
			<Text color={Colors.ACCENT}>{paddedLabel}</Text>
			<Box width={valueWidth} alignItems="flex-start">
				{type === FormInputType.CHECKBOX && (
					<>
						<Text dimColor>{'['}</Text>
						<Text color={selected ? Colors.SELECTED : Colors.DEFAULT}>
							{value === CheckboxState.CHECKED ? '✓' : '✗'}
						</Text>
						<Text dimColor>{']'}</Text>
					</>
				)}

				{type === FormInputType.TEXT &&
					(value ? (
						<Text
							color={selected ? Colors.SELECTED : Colors.DEFAULT}
							wrap="wrap"
						>
							{value}
						</Text>
					) : (
						<Text
							dimColor={!selected}
							color={selected ? Colors.SELECTED : Colors.DEFAULT}
						>
							{placeholder}
						</Text>
					))}

				{type === FormInputType.PASSWORD &&
					(value ? (
						<Text
							color={selected ? Colors.SELECTED : Colors.DEFAULT}
							wrap="wrap"
						>
							{hidePassword(value)}
						</Text>
					) : (
						<Text
							dimColor={!selected}
							color={selected ? Colors.SELECTED : Colors.DEFAULT}
						>
							{placeholder}
						</Text>
					))}
			</Box>
		</Box>
	);
};
