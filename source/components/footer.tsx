import React from 'react';
import {Box} from 'ink';

type FooterProps = {
	children: React.ReactNode;
};

export const Footer = ({children}: FooterProps) => (
	<Box
		width="100%"
		flexDirection="column"
		alignItems="flex-start"
		justifyContent="flex-end"
		paddingLeft={2}
		paddingRight={2}
		paddingTop={1}
		height={3}
	>
		{children}
	</Box>
);
