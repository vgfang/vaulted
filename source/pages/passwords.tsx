import {Box} from 'ink';
import React, {useEffect, useState} from 'react';
import {useCustomInput} from '../hooks/custom-input';
import {Header} from '../components/header';
import {Screens, useScreen} from '../hooks/screen-context';
import {Control, Controls} from '../components/controls';
import {Footer} from '../components/footer';
import {Table} from '../components/table';
import {BufferLine} from '../components/buffer-line';
import {Password} from '../types';
import {
	navigateLeftRight,
	navigateUpDown,
	shortcutControl,
} from '../utils/navigation';
import {CONTROL_WIDTH} from '../utils/constants';
import {formatDate, hasValidTimestamp} from '../utils/dates';
import {logToFile} from '@/core/core';
import {copyToClipboard} from '@/utils/clipboard';

export const Passwords = () => {
	const {
		goBack,
		setCurrentScreen,
		setSelectedPassword,
		selectedVault,
		currentVaultManager,
		showToast,
	} = useScreen();

	const [passwords, setPasswords] = useState<Password[]>([]);
	const [selectedTableIndex, setSelectedTableIndex] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);

	const tableHeader = ['f', 'name', 'email', 'description', 'last updated'];

	// Fetch passwords from selected vault using session vault manager
	useEffect(() => {
		const fetchPasswords = async () => {
			if (!selectedVault || !currentVaultManager) return;

			try {
				const passwords = await currentVaultManager.getPasswords();
				logToFile('Loaded passwords: ' + JSON.stringify(passwords));
				setPasswords(passwords);
			} catch (error) {
				console.error('Failed to load passwords:', error);
				setPasswords([]);
			}
		};

		fetchPasswords();
	}, [selectedVault, currentVaultManager]);

	// Transform passwords data for table display
	const passwordsToDisplay = (passwordList: Password[]) => {
		return passwordList.map(password => ({
			f: password.isFavorite == 1 ? '★' : '',
			name: password.name,
			email: password.email || '',
			'date created': hasValidTimestamp(password.createdAt)
				? formatDate(password.createdAt)
				: 'unknown',
		}));
	};

	const handleNew = () => {
		setCurrentScreen(Screens.EDIT_PASSWORD_MENU);
		setSelectedPassword(null);
	};

	const handleEdit = () => {
		setCurrentScreen(Screens.EDIT_PASSWORD_MENU);
		setSelectedPassword(passwords[selectedTableIndex] ?? null);
	};

	const handleDelete = () => {
		setIsDeleting(true);
	};

	const handleFavorite = () => {
		// TODO: Implement favorite toggle
	};

	const handleSearch = () => {
		// TODO: Implement search
	};

	const handleCopy = () => {
		copyToClipboard(passwords[selectedTableIndex]?.password || '');
		showToast('Copied to clipboard');
	};

	const controls: Control[] = [
		{shortcut: 'b', tag: 'Back', func: goBack},
		{shortcut: 'c', tag: 'Copy', func: handleCopy},
		{shortcut: 'e', tag: 'Edit', func: handleEdit},
		{shortcut: 'n', tag: 'New', func: handleNew},
		{shortcut: 's', tag: 'Sea.', func: handleSearch},
		{shortcut: 'f', tag: 'Fav.', func: handleFavorite},
		{shortcut: 'd', tag: 'Del', func: handleDelete},
	];
	const [selectedControlIndex, setSelectedControlIndex] = useState(1);

	const title = selectedVault ? `Vault: ${selectedVault.name}` : 'Error';

	const {buffer, enableBuffer, clearBuffer} = useCustomInput((input, key) => {
		if (buffer.isActive && key.return) {
			if (isDeleting) {
				// TODO: Implement password deletion confirmation
				setIsDeleting(false);
			}
			clearBuffer();
			return;
		}

		if (!buffer.isActive) {
			// normal navigation mode
			const shortcutHandled = shortcutControl(input, controls);
			if (!shortcutHandled) {
				navigateUpDown(
					input,
					key,
					selectedTableIndex,
					passwords.length,
					setSelectedTableIndex,
				);
				navigateLeftRight(
					input,
					key,
					selectedControlIndex,
					controls.length,
					setSelectedControlIndex,
				);
			}
		}
	});

	// Enable buffer for deletion confirmation
	useEffect(() => {
		if (isDeleting) {
			enableBuffer(true, false, 50); // not hidden for confirmation text
		}
	}, [isDeleting]);

	// Reset states when buffer becomes inactive (escape pressed)
	useEffect(() => {
		if (!buffer.isActive) {
			setIsDeleting(false);
		}
	}, [buffer.isActive]);

	return (
		<Box
			flexDirection="column"
			flexGrow={1}
			justifyContent="flex-start"
			alignItems="center"
		>
			<Header title={title} />
			<Box flexGrow={1}>
				<Table
					rows={passwordsToDisplay(passwords)}
					header={tableHeader}
					selectedIndex={selectedTableIndex}
					isDeleting={isDeleting}
				/>
			</Box>
			<Footer>
				<BufferLine
					buffer={buffer}
					label={isDeleting ? 'Enter password name to delete' : 'Input'}
				/>
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
