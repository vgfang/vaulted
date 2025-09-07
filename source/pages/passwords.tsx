import {Box} from 'ink';
import React, {useState} from 'react';
import {useCustomInput} from '../hooks/custom-input';
import {Header} from '../components/header';
import {Screens, useScreen} from '../hooks/screen-context';
import {Control, Controls} from '../components/controls';
import {Footer} from '../components/footer';
import {navigateLeftRight, shortcutControl} from '../utils/navigation';
import {CONTROL_WIDTH} from '../utils/constants';

export const Passwords = () => {
	const {goBack, setCurrentScreen, setSelectedPassword} = useScreen();

	const handleNew = () => {
		setCurrentScreen(Screens.EDIT_PASSWORD_MENU);
		setSelectedPassword(null);
	};

	const handleEdit = () => {
		setCurrentScreen(Screens.EDIT_PASSWORD_MENU);
		// TODO: fix
		// setSelectedPassword(passwords[selectedTableIndex]);
	};

	const controls: Control[] = [
		{shortcut: 'b', tag: 'Back', func: goBack},
		{shortcut: 'c', tag: 'Copy', func: () => {}},
		{shortcut: 'd', tag: 'Edit', func: handleEdit},
		{shortcut: 'n', tag: 'New', func: handleNew},
		{shortcut: 's', tag: 'Sea.', func: () => {}},
		{shortcut: 'f', tag: 'Fav.', func: () => {}},
		{shortcut: 'd', tag: 'Del', func: () => {}},
	];
	const [selectedControlIndex, setSelectedControlIndex] = useState(1);

	const {selectedVault} = useScreen();
	const title = selectedVault ? `Vault: ${selectedVault.name}` : 'Error';

	useCustomInput((input, key) => {
		navigateLeftRight(
			input,
			key,
			selectedControlIndex,
			controls.length,
			setSelectedControlIndex,
		);
		shortcutControl(input, controls);
	});
	return (
		<Box
			flexDirection="column"
			flexGrow={1}
			justifyContent="space-between"
			alignItems="center"
		>
			<Header title={title} />
			<Footer>
				<Controls
					controls={controls}
					direction="row"
					gap={2}
					fixedWidth={CONTROL_WIDTH}
					controlGap={1}
					selectedIndex={selectedControlIndex}
					bordered={true}
				/>
			</Footer>
		</Box>
	);
};
