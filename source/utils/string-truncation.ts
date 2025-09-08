export const truncateString = (
	text: string,
	maxWidth: number,
	ellipsis: string = '…',
): string => {
	if (text.length <= maxWidth) {
		return text;
	}

	const ellipsisLength = ellipsis.length;
	if (maxWidth <= ellipsisLength) {
		return ellipsis.slice(0, maxWidth);
	}

	return text.slice(0, maxWidth - ellipsisLength) + ellipsis;
};

export const calculateOptimalColumnWidths = (
	header: string[],
	rows: Record<string, any>[],
	availableWidth: number,
	minColumnWidth: number = 3,
	padding: number = 3, // space for separators between columns
): number[] => {
	const numColumns = header.length + 1; // +1 for index column
	const separatorSpace = (numColumns - 1) * padding;
	const usableWidth = availableWidth - separatorSpace;

	if (usableWidth <= numColumns * minColumnWidth) {
		// not enough space, give minimum width to all columns
		return new Array(numColumns).fill(minColumnWidth);
	}

	// calculate natural widths
	const indexWidth = Math.max(1, String(rows.length).length);
	const headerColWidths = header.map(col =>
		Math.max(col.length, ...rows.map(row => String(row[col] ?? '').length)),
	);
	const naturalWidths = [indexWidth, ...headerColWidths];

	// check if natural widths fit
	const totalNaturalWidth = naturalWidths.reduce(
		(sum, width) => sum + width,
		0,
	);
	if (totalNaturalWidth <= usableWidth) {
		// distribute extra space proportionally
		const extraSpace = usableWidth - totalNaturalWidth;
		const totalWeight = naturalWidths.reduce((sum, width) => sum + width, 0);

		return naturalWidths.map(width => {
			const proportion = width / totalWeight;
			return Math.floor(width + extraSpace * proportion);
		});
	}

	// need to truncate - distribute space proportionally based on natural width
	const totalWeight = naturalWidths.reduce((sum, width) => sum + width, 0);

	return naturalWidths.map(width => {
		const proportion = width / totalWeight;
		const allocatedWidth = Math.floor(usableWidth * proportion);
		return Math.max(minColumnWidth, allocatedWidth);
	});
};
