import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors';
import {useScreen} from '../hooks/screen-context';

export enum ToastLineType {
	SUCCESS = 'info',
	ERROR = 'error',
	WARNING = 'warning',
}

const colorMap = {
	[ToastLineType.SUCCESS]: Colors.ACCENT,
	[ToastLineType.ERROR]: Colors.ERROR,
	[ToastLineType.WARNING]: Colors.HIGHLIGHT,
};

export const ToastLine = () => {
	const {cols, toast: contextToast} = useScreen();
	const labelWidth = contextToast.type.length + 2;
	const contentWidth = cols - labelWidth - 6;
	const paddingLeft = 2;

	const shouldShow = contextToast.message.trim() !== '';

	return (
		<Box minHeight={1} paddingLeft={paddingLeft} flexDirection="row">
			{shouldShow && (
				<>
					<Box width={labelWidth}>
						<Text
							color={Colors.DEFAULT}
							backgroundColor={colorMap[contextToast.type]}
						>
							{contextToast.type}
						</Text>
						<Text color={colorMap[contextToast.type]}>:</Text>
					</Box>

					<Box width={contentWidth} flexDirection="row">
						<Text color={colorMap[contextToast.type]}>
							{contextToast.message}
						</Text>
					</Box>
				</>
			)}
		</Box>
	);
};
