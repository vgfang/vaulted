import React from 'react';
import {Box, Text} from 'ink';
import {Screens, useScreen} from './hooks/screen-context.js';
import {Title} from './pages/title.js';
import {Vaults} from './pages/vaults.js';
import {Colors} from './styles/colors.js';
import {EditVault} from './pages/edit-vault.js';
import {Passwords} from './pages/passwords.js';
import {Help} from './pages/help.js';
import {Settings} from './pages/settings.js';
import {MINIMUM_WIDTH, MINIMUM_HEIGHT, TITLE} from './utils/constants.js';
import {useCustomInput} from './hooks/custom-input.js';
import {EditPassword} from './pages/edit-password.js';
import {ToastLine} from './components/toast-line.js';

export const Router = () => {
	const {currentScreen, cols, rows, isTooSmall} = useScreen();

	useCustomInput((_1, _2) => {}); // accept global inputs

	if (isTooSmall) {
		return (
			<Box
				flexDirection="column"
				width={cols}
				height={rows}
				borderStyle="round"
				borderColor={Colors.ERROR}
				justifyContent="center"
				alignItems="center"
				paddingX={2}
				gap={2}
			>
				<Box flexDirection="column" gap={0} alignItems="center">
					<Text color={Colors.ERROR}>⚠ Terminal Too Small</Text>
					<Text dimColor>
						Minimum: {MINIMUM_WIDTH} columns × {MINIMUM_HEIGHT} rows
					</Text>
					<Text dimColor>
						Current: {cols} columns × {rows} rows
					</Text>
				</Box>
				<Box flexDirection="column" alignItems="center">
					<Text dimColor>Please resize your terminal.</Text>
					<Text dimColor>Press 'q' to quit.</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box
			flexDirection="column"
			width={cols}
			height={rows}
			borderStyle="round"
			borderColor={Colors.BORDER}
		>
			<ToastLine />
			{currentScreen === Screens.TITLE && <Title />}
			{currentScreen === Screens.VAULT_MENU && <Vaults />}
			{currentScreen === Screens.EDIT_VAULT_MENU && <EditVault />}
			{currentScreen === Screens.PASSWORD_MENU && <Passwords />}
			{currentScreen === Screens.EDIT_PASSWORD_MENU && <EditPassword />}
			{currentScreen === Screens.SETTINGS && <Settings />}
			{currentScreen === Screens.HELP && <Help />}
		</Box>
	);
};
