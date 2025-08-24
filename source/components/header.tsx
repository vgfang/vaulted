import React from 'react';
import {Box, Text} from 'ink';
import {Colors} from '../styles/colors.js';

type HeaderProps = {
	title: string;
};

export const Header = ({title}: HeaderProps) => (
	<Box
		flexDirection="column"
		justifyContent="center"
		alignItems="center"
		paddingY={1}
		width="100%"
	>
		<Text color={Colors.HEADER} bold>
			[ {title} ]
		</Text>
	</Box>
);
