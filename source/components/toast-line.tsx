import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors';
import {useScreen} from '../hooks/screen-context';

export enum ToastLineType {
	SUCCESS = 'success',
	ERROR = 'error',
	WARNING = 'warning',
	INFO = 'info',
}

export const ToastLine = () => {
	const {cols, toast: contextToast} = useScreen();
	const labelWidth = contextToast.type.length + 2;
	const contentWidth = cols - labelWidth - 6;

	const shouldShow = contextToast.message.trim() !== '';

	return (
		<Box minHeight={1} flexDirection="row">
			{shouldShow && (
				<>
					<Box width={labelWidth}>
						<Text color={Colors.ACCENT} backgroundColor={Colors.BACKGROUND}>
							{contextToast.type}
						</Text>
						<Text color={Colors.DEFAULT}>:</Text>
					</Box>

					<Box width={contentWidth} flexDirection="row">
						<Text color={Colors.DEFAULT}>{contextToast.message}</Text>
					</Box>
				</>
			)}
		</Box>
	);
};
