import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors.js';

type TableProps = {
	rows: Record<string, any>[];
	header: string[];
	selectedIndex?: number;
	isDeleting?: boolean;
};

export const Table = ({
	rows,
	header,
	selectedIndex,
	isDeleting,
}: TableProps) => {
	if (!rows || rows.length === 0) {
		return (
			<Box>
				<Text dimColor>no data</Text>
			</Box>
		);
	}

	// add index column to the front of headers
	const columns = ['#', ...header];
	// calculate column widths, including index column
	const indexWidth = Math.max(1, String(rows.length).length);
	const headerColWidths = header.map(col =>
		Math.max(col.length, ...rows.map(row => String(row[col] ?? '').length)),
	);
	const colWidths = [indexWidth, ...headerColWidths];
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
						const cellValue = isIndexColumn
							? String(idx + 1)
							: String(row[col] ?? '');

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
