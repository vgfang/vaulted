import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors.js';

type TableProps = {
	rows: Record<string, any>[];
	header?: string[];
	selectedIndex?: number;
};

export const Table = ({rows, header, selectedIndex}: TableProps) => {
	if (!rows || rows.length === 0) {
		return (
			<Box>
				<Text dimColor>no data</Text>
			</Box>
		);
	}

	// if no header provided, use keys from first row
	const columns = header ?? Object.keys(rows[0] ?? {});
	const colWidths = columns.map(col =>
		Math.max(col.length, ...rows.map(row => String(row[col] ?? '').length)),
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
			{header && (
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
			)}

			{header && (
				<Text dimColor>{colWidths.map(w => '─'.repeat(w)).join('─┼─')}</Text>
			)}

			{rows.map((row, idx) => (
				<Box key={idx} flexDirection="row">
					{columns.map((col, i) => (
						<Box key={i} flexDirection="row">
							<Text
								color={selectedIndex === idx ? Colors.SELECTED : Colors.DEFAULT}
							>
								{pad(String(row[col] ?? ''), colWidths[i] ?? 0)}
							</Text>
							{i < columns.length - 1 && <Text dimColor> │ </Text>}
						</Box>
					))}
				</Box>
			))}
		</Box>
	);
};
