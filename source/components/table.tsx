import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors.js';
import {useScreen} from '../hooks/screen-context';
import {
	truncateString,
	calculateOptimalColumnWidths,
} from '../utils/string-truncation';

type TableProps = {
	rows: Record<string, any>[];
	header: string[];
	selectedIndex?: number;
	isDeleting?: boolean;
	minPadding?: number; // minimum space between table and border
};

export const Table = ({
	rows,
	header,
	selectedIndex,
	isDeleting,
	minPadding = 2,
}: TableProps) => {
	const {cols} = useScreen();
	if (!rows || rows.length === 0) {
		return (
			<Box>
				<Text dimColor>no data</Text>
			</Box>
		);
	}

	// add index column to the front of headers
	const columns = ['#', ...header];
	// calculate optimal column widths based on available space
	const availableWidth = cols - minPadding * 2; // reserve space for padding
	const colWidths = calculateOptimalColumnWidths(
		header,
		rows,
		availableWidth,
		3, // minimum column width
		3, // separator padding
	);
	const pad = (text: string, width: number) =>
		text + ' '.repeat(width - text.length);
	const centerPad = (text: string, width: number) => {
		const padding = width - text.length;
		const leftPadding = Math.floor(padding / 2);
		const rightPadding = padding - leftPadding;
		return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
	};

	return (
		<Box flexDirection="column">
			<Box flexDirection="row">
				{columns.map((col, i) => (
					<Box key={i} flexDirection="row">
						<Text color={Colors.HIGHLIGHT}>
							{centerPad(col, colWidths[i] ?? 0)}
						</Text>
						{i < columns.length - 1 && <Text dimColor> │ </Text>}
					</Box>
				))}
			</Box>

			<Text dimColor>{colWidths.map(w => '─'.repeat(w)).join('─┼─')}</Text>

			{rows.map((row, idx) => (
				<Box key={idx} flexDirection="row">
					{columns.map((col, i) => {
						const isIndexColumn = i === 0;
						let cellValue = isIndexColumn
							? String(idx + 1)
							: String(row[col] ?? '');

						// truncate cell content if it exceeds column width
						cellValue = truncateString(cellValue, colWidths[i] ?? 0);

						return (
							<Box key={i} flexDirection="row">
								<Text
									color={
										selectedIndex === idx && isDeleting
											? Colors.ACCENT
											: selectedIndex === idx
											? Colors.SELECTED
											: Colors.DEFAULT
									}
								>
									{pad(cellValue, colWidths[i] ?? 0)}
								</Text>
								{i < columns.length - 1 && <Text dimColor> │ </Text>}
							</Box>
						);
					})}
				</Box>
			))}
		</Box>
	);
};
