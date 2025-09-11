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

type ColumnConfig = {
	name: string;
	minWidth?: number;
	maxWidth?: number;
};

export const calculateOptimalColumnWidths = (
	columns: ColumnConfig[],
	rows: Record<string, any>[],
	availableWidth: number,
	padding: number = 3, // space for separators between columns
): number[] => {
	const numColumns = columns.length;
	const separatorSpace = (numColumns - 1) * padding;
	const usableWidth = availableWidth - separatorSpace;

	// calculate natural widths for each column
	const naturalWidths = columns.map((col, index) => {
		// safety check - ensure col exists
		if (!col || !col.name) {
			console.warn('Invalid column at index', index, col);
			return 3; // fallback width
		}

		// special handling for index column since it doesn't exist in row data
		if (index === 0 && col.name === '#') {
			const headerWidth = col.name.length;
			const maxRowNumber = rows.length;
			const contentWidth = String(maxRowNumber).length;
			return Math.max(headerWidth, contentWidth);
		}

		// calculate width based on header and content for data columns
		const headerWidth = col.name.length;
		const contentWidth = Math.max(
			...rows.map(row => String(row[col.name] ?? '').length),
			0,
		);
		return Math.max(headerWidth, contentWidth);
	});

	// apply min/max constraints to natural widths
	const constrainedWidths = naturalWidths.map((width, index) => {
		const col = columns[index];
		if (!col) return width; // safety fallback

		let constrainedWidth = width;

		if (col.minWidth !== undefined) {
			constrainedWidth = Math.max(constrainedWidth, col.minWidth);
		}
		if (col.maxWidth !== undefined) {
			constrainedWidth = Math.min(constrainedWidth, col.maxWidth);
		}

		return constrainedWidth;
	});

	// check if constrained widths fit
	const totalConstrainedWidth = constrainedWidths.reduce(
		(sum, width) => sum + width,
		0,
	);

	if (totalConstrainedWidth <= usableWidth) {
		// we have extra space - distribute it to flexible columns (those without maxWidth)
		const extraSpace = usableWidth - totalConstrainedWidth;
		const flexibleColumns = columns.filter(col => col.maxWidth === undefined);
		const flexibleIndices = columns
			.map((col, i) => (col.maxWidth === undefined ? i : -1))
			.filter(i => i >= 0);

		if (flexibleColumns.length > 0) {
			const extraPerColumn = Math.floor(extraSpace / flexibleColumns.length);
			const finalWidths = [...constrainedWidths];

			flexibleIndices.forEach(index => {
				if (finalWidths[index] !== undefined) {
					finalWidths[index] += extraPerColumn;
				}
			});

			return finalWidths;
		}

		return constrainedWidths;
	}

	// not enough space - we need to shrink columns
	// first, ensure all columns meet their minimum requirements
	const minWidths = columns.map(col => {
		return col?.minWidth !== undefined ? col.minWidth : 3; // default min width of 3
	});

	const totalMinWidth = minWidths.reduce((sum, width) => sum + width, 0);

	if (totalMinWidth >= usableWidth) {
		// even minimum widths don't fit - return minimums anyway
		return minWidths;
	}

	// distribute available space proportionally, respecting constraints
	const availableForDistribution = usableWidth - totalMinWidth;
	const flexibleSpace = constrainedWidths.map((width, index) =>
		Math.max(0, width - (minWidths[index] ?? 3)),
	);
	const totalFlexibleSpace = flexibleSpace.reduce(
		(sum, space) => sum + space,
		0,
	);

	if (totalFlexibleSpace === 0) {
		return minWidths;
	}

	return constrainedWidths.map((_, index) => {
		const minWidth = minWidths[index] ?? 3;
		const flexSpace = flexibleSpace[index] ?? 0;
		const proportion = flexSpace / totalFlexibleSpace;
		const additionalSpace = Math.floor(availableForDistribution * proportion);
		const maxWidth = columns[index]?.maxWidth ?? Infinity;

		return Math.min(minWidth + additionalSpace, maxWidth);
	});
};
