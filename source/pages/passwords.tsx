import {Box} from 'ink';
import React, {useState} from 'react';
import {useCustomInput} from '../hooks/custom-input';
import {Header} from '../components/header';
import {useScreen} from '../hooks/screen-context';
import {Control, Controls} from '../components/controls';
import {Footer} from '../components/footer';
import {navigateLeftRight, shortcutControl} from '../utils/navigation';
import {CONTROL_WIDTH} from '../utils/constants';

export const Passwords = () => {
	const {goBack} = useScreen();
	const controls: Control[] = [
		{shortcut: 'b', tag: 'Back', func: goBack},
		{shortcut: 'c', tag: 'Copy', func: () => {}},
		{shortcut: 'd', tag: 'Edit', func: () => {}},
		{shortcut: 'n', tag: 'New', func: () => {}},
		{shortcut: 's', tag: 'Sea.', func: () => {}},
		{shortcut: 'f', tag: 'Fav.', func: () => {}},
		{shortcut: 'd', tag: 'Del', func: () => {}},
	];
	const [selectedControlIndex, setSelectedControlIndex] = useState(0);

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
