import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors';
import {TextBuffer} from '../hooks/custom-input';
import {useScreen} from '../hooks/screen-context';

interface BufferLineProps {
	buffer: TextBuffer;
	label?: string;
	hidden?: boolean;
}

export const hideText = (text: string) => {
	return '*'.repeat(text.length);
};

export const BufferLine = ({buffer, label = 'Input'}: BufferLineProps) => {
	const {cols} = useScreen();
	const displayText = buffer.isHidden
		? hideText(buffer.content)
		: buffer.content;
	const labelText = `${label}: `;

	const labelWidth = labelText.length;
	const contentWidth = cols - labelWidth - 6;

	// truncate from front if text is too long
	const getTruncatedText = () => {
		if (displayText.length <= contentWidth) {
			return displayText;
		}
		const truncatedContent = displayText.slice(-(contentWidth - 3));
		return truncatedContent;
	};

	const truncatedText = getTruncatedText();
	const needsTruncation = displayText.length > contentWidth;

	return (
		<Box minHeight={1} flexDirection="row">
			{buffer.isActive && (
				<>
					<Box width={labelWidth}>
						<Text color={Colors.ACCENT}>{labelText}</Text>
					</Box>

					<Box width={contentWidth} flexDirection="row">
						{needsTruncation && <Text color={Colors.HIGHLIGHT}>...</Text>}
						<Text color={Colors.DEFAULT}>{truncatedText}</Text>
					</Box>
				</>
			)}
		</Box>
	);
};
