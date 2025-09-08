import React, {useRef, useState} from 'react';
import {Box, Text} from 'ink';
import {useCustomInput} from '../hooks/custom-input';
import {Control, Controls} from '../components/controls.js';
import {Screens, useScreen} from '../hooks/screen-context.js';
import {Footer} from '../components/footer.js';
import {randomQuote} from '../utils/random-quote.js';
import {
	navigateEnter,
	navigateUpDown,
	shortcutControl,
} from '../utils/navigation.js';
import {Colors} from '../styles/colors.js';
import {TITLE} from '../utils/constants.js';
import pkg from '../../package.json';

export const Title = () => {
	const version = pkg.version;
	const description = 'minimal local-first password manager';

	const controls: Control[] = [
		{
			shortcut: 'v',
			tag: 'Vaults',
			func: () => setCurrentScreen(Screens.VAULT_MENU),
		},
		{
			shortcut: 's',
			tag: 'Settings',
			func: () => setCurrentScreen(Screens.SETTINGS),
		},
		{shortcut: 'h', tag: 'Help', func: () => setCurrentScreen(Screens.HELP)},
		{shortcut: 'q', tag: 'Quit', func: () => quit()},
	];

	const {setCurrentScreen} = useScreen();

	const quote = useRef(randomQuote());
	const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);

	const {quit} = useCustomInput((input, key) => {
		const shortcutHandled = shortcutControl(input, controls);
		if (!shortcutHandled) {
			navigateEnter(key, selectedMenuIndex, controls);
			navigateUpDown(
				input,
				key,
				selectedMenuIndex,
				controls.length,
				setSelectedMenuIndex,
			);
		}
	});

	return (
		<Box
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			flexGrow={1}
		>
			<Box
				flexGrow={1}
				justifyContent="center"
				alignItems="center"
				flexDirection="column"
			>
				<Text color={Colors.HEADER}>{TITLE}</Text>
				<Box
					flexDirection="column"
					justifyContent="flex-start"
					alignItems="flex-start"
					height={2}
					minHeight={2}
				>
					<Text color={Colors.HIGHLIGHT}>{description}</Text>
					<Text color={Colors.ACCENT}>version: {version}</Text>
				</Box>
				<Controls
					controls={controls}
					direction="column"
					gap={1}
					selectedIndex={selectedMenuIndex}
					controlGap={16}
				/>
			</Box>
			<Footer>
				<Text dimColor>{quote.current}</Text>
			</Footer>
		</Box>
	);
};
