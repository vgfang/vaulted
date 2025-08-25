import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors.js';

export interface Control {
	shortcut: string;
	tag: string;
	gap?: number;
	func?: () => void;
}

const Control = ({
	shortcut,
	tag,
	selected = false,
	fixedWidth,
	gap,
	bordered = false,
}: Control & {selected?: boolean; fixedWidth?: number; bordered?: boolean}) => {
	return (
		<Box
			flexDirection="row"
			gap={gap}
			justifyContent="space-between"
			{...(fixedWidth ? {width: fixedWidth} : {})}
		>
			<Box flexDirection="row" justifyContent="flex-start">
				{bordered && (
					<Text color={selected ? Colors.SELECTED : Colors.DEFAULT}>[</Text>
				)}
				<Text color={selected ? Colors.SELECTED : Colors.DEFAULT}>{tag}</Text>
			</Box>
			<Box flexDirection="row" justifyContent="flex-end">
				<Text color={Colors.SHORTCUT}>{shortcut}</Text>
				{bordered && (
					<Text color={selected ? Colors.SELECTED : Colors.DEFAULT}>]</Text>
				)}
			</Box>
		</Box>
	);
};

interface ControlsProps {
	controls: Control[];
	direction: 'row' | 'column';
	gap: number;
	selectedIndex: number;
	fixedWidth?: number;
	controlGap?: number;
	bordered?: boolean;
}

export const Controls = ({
	controls,
	direction,
	gap,
	selectedIndex,
	fixedWidth,
	controlGap,
	bordered,
}: ControlsProps) => {
	const padding = direction === 'row' ? 0 : 2;
	const internalGap = controlGap ?? (direction === 'row' ? 16 : 16);

	return (
		<Box flexDirection={direction} gap={gap} padding={padding}>
			{controls.map(({shortcut, tag}, index) => (
				<Control
					key={index}
					shortcut={shortcut}
					tag={tag}
					selected={index === selectedIndex}
					fixedWidth={fixedWidth}
					gap={internalGap}
					bordered={bordered}
				/>
			))}
		</Box>
	);
};
