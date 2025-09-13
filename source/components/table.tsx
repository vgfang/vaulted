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
	header: {name: string; minWidth?: number; maxWidth?: number}[];
	selectedIndex?: number;
	isDeleting?: boolean;
	minPadding?: number; // minimum space between table and border
	scrollOffset?: number; // current scroll position
	maxVisibleRows?: number; // maximum rows to display at once
};

export const Table = ({
	rows,
	header,
	selectedIndex,
	isDeleting,
	minPadding = 4,
	scrollOffset = 0,
	maxVisibleRows,
}: TableProps) => {
	const {cols, rows: terminalRows} = useScreen();
	if (!rows || rows.length === 0) {
		return (
			<Box>
				<Text dimColor>no data</Text>
			</Box>
		);
	}

	// add index column to the front of headers
	const indexColumn = {name: '#', minWidth: 1, maxWidth: 3};
	const allColumns = [indexColumn, ...header];
	const columnNames = allColumns.map(col => col?.name || 'Unknown');

	// calculate optimal column widths based on available space
	const availableWidth = cols - minPadding * 2; // reserve space for padding
	const colWidths = calculateOptimalColumnWidths(
		allColumns,
		rows,
		availableWidth,
		3,
	);

	// calculate available space for table rows
	const totalRows = rows.length;
	let calculatedMaxRows = totalRows;

	if (maxVisibleRows !== undefined) {
		calculatedMaxRows = maxVisibleRows;
	} else if (terminalRows > 0) {
		const uiOverhead = 12;
		calculatedMaxRows = Math.max(3, terminalRows - uiOverhead);
	}

	const shouldScroll = calculatedMaxRows < totalRows;
	const availableRows = shouldScroll ? calculatedMaxRows : totalRows;
	const canScrollDown =
		shouldScroll && scrollOffset + availableRows < totalRows;

	let visibleRows = [...rows];
	let startIndex = scrollOffset;
	let endIndex = Math.min(scrollOffset + availableRows, totalRows);

	if (canScrollDown) {
		// reserve space for bottom truncation indicator
		endIndex = Math.min(scrollOffset + availableRows - 1, totalRows);
	}

	visibleRows = rows.slice(startIndex, endIndex);

	const pad = (text: string, width: number) => {
		// safety check - ensure text is a string
		if (text === null || text === undefined) {
			text = '';
		} else if (typeof text !== 'string') {
			text = String(text);
		}
		return text + ' '.repeat(Math.max(0, width - text.length));
	};
	const centerPad = (text: string, width: number) => {
		// safety check - ensure text is a string
		if (text === null || text === undefined) {
			text = '';
		} else if (typeof text !== 'string') {
			text = String(text);
		}

		// if text is longer than width, truncate it first
		if (text.length > width) {
			text = truncateString(text, width);
		}

		const padding = width - text.length;
		const leftPadding = Math.max(0, Math.floor(padding / 2));
		const rightPadding = Math.max(0, padding - leftPadding);
		return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
	};

	return (
		<Box flexDirection="column">
			<Box flexDirection="row">
				{columnNames.map((col, i) => (
					<Box key={i} flexDirection="row">
						<Text color={Colors.HIGHLIGHT}>
							{centerPad(col, colWidths[i] ?? 0)}
						</Text>
						{i < columnNames.length - 1 && <Text dimColor> │ </Text>}
					</Box>
				))}
			</Box>

			<Text dimColor>{colWidths.map(w => '─'.repeat(w)).join('─┼─')}</Text>

			{visibleRows.map((row, idx) => {
				const actualIndex = startIndex + idx;
				return (
					<Box key={actualIndex} flexDirection="row">
						{columnNames.map((col, i) => {
							const isIndexColumn = i === 0;
							let cellValue = isIndexColumn
								? String(actualIndex + 1)
								: String(row[col] ?? '');

							// truncate cell content if it exceeds column width
							cellValue = truncateString(cellValue, colWidths[i] ?? 0);

							return (
								<Box key={i} flexDirection="row">
									<Text
										color={
											selectedIndex === actualIndex && isDeleting
												? Colors.ACCENT
												: selectedIndex === actualIndex
												? Colors.SELECTED
												: Colors.DEFAULT
										}
									>
										{pad(cellValue, colWidths[i] ?? 0)}
									</Text>
									{i < columnNames.length - 1 && <Text dimColor> │ </Text>}
								</Box>
							);
						})}
					</Box>
				);
			})}

			{canScrollDown && (
				<Box flexDirection="row">
					{columnNames.map((col, i) => {
						const isIndexColumn = i === 0;
						const isFavoriteColumn = col === 'f';
						let cellValue: string;

						if (isIndexColumn) {
							cellValue = '_';
						} else if (isFavoriteColumn) {
							cellValue = '_';
						} else {
							cellValue = '...';
						}

						return (
							<Box key={i} flexDirection="row">
								<Text color={isIndexColumn ? Colors.DEFAULT : Colors.HIGHLIGHT}>
									{centerPad(cellValue, colWidths[i] ?? 0)}
								</Text>
								{i < columnNames.length - 1 && <Text dimColor> │ </Text>}
							</Box>
						);
					})}
				</Box>
			)}
		</Box>
	);
};
