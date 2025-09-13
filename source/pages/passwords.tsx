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
	navigateEnter,
	navigateLeftRight,
	navigateUpDown,
	shortcutControl,
} from '../utils/navigation';
import {CONTROL_WIDTH} from '../utils/constants';
import {formatDate, hasValidTimestamp} from '../utils/dates';
import {logToFile} from '@/core/core';
import {copyToClipboard} from '@/utils/clipboard';
import {ToastLineType} from '../components/toast-line';

export const Passwords = () => {
	const {
		goBack,
		setCurrentScreen,
		setSelectedPassword,
		restorePasswordPosition,
		savePasswordPosition,
		selectedVault,
		currentVaultManager,
		showToast,
		currentScreen,
		rows: terminalRows,
	} = useScreen();

	const [passwords, setPasswords] = useState<Password[]>([]);
	const [selectedTableIndex, setSelectedTableIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);

	const tableHeader = [
		{name: 'f', minWidth: 1},
		{name: 'name'},
		{name: 'email'},
		{name: 'updated', minWidth: 10, maxWidth: 10},
	];

	// Fetch passwords from selected vault using session vault manager
	useEffect(() => {
		if (currentScreen === Screens.PASSWORD_MENU) {
			const fetchPasswords = async () => {
				if (!selectedVault || !currentVaultManager) return;

				try {
					const passwords = await currentVaultManager.getPasswords();
					logToFile('Loaded passwords: ' + JSON.stringify(passwords));

					// sort passwords: separate favorites and non-favorites, then sort each cluster by updatedAt
					const favorites = passwords.filter(p => p.isFavorite === 1);
					const nonFavorites = passwords.filter(p => p.isFavorite !== 1);

					const sortedFavorites = favorites.sort(
						(a, b) => b.updatedAt - a.updatedAt,
					);
					const sortedNonFavorites = nonFavorites.sort(
						(a, b) => b.updatedAt - a.updatedAt,
					);

					const sortedPasswords = [...sortedFavorites, ...sortedNonFavorites];
					setPasswords(sortedPasswords);

					// restore selected row position using useScreen hook
					const restoredIndex = restorePasswordPosition(sortedPasswords);
					setSelectedTableIndex(restoredIndex);
					// reset scroll when passwords change
					setScrollOffset(0);
				} catch (error) {
					console.error('Failed to load passwords:', error);
					setPasswords([]);
				}
			};

			fetchPasswords();
		}
	}, [selectedVault, currentVaultManager, currentScreen]);

	const passwordsToDisplay = (passwordList: Password[]) => {
		return passwordList.map(password => ({
			f: password.isFavorite == 1 ? '★' : '',
			name: password.name,
			email: password.email || '',
			updated: hasValidTimestamp(password.updatedAt)
				? formatDate(password.updatedAt)
				: 'unknown',
		}));
	};

	const handleNew = () => {
		setSelectedPassword(null);
		savePasswordPosition(null); // clear saved position since we're creating new
		setCurrentScreen(Screens.EDIT_PASSWORD_MENU);
	};

	const handleEdit = () => {
		const selectedPassword = passwords[selectedTableIndex];
		setSelectedPassword(selectedPassword ?? null);
		// save current password position for restoration when coming back
		savePasswordPosition(selectedPassword ?? null);
		setCurrentScreen(Screens.EDIT_PASSWORD_MENU);
	};

	const handleDelete = () => {
		setIsDeleting(true);
	};

	const handleFavorite = async () => {
		if (!currentVaultManager) return;
		const wasFavorite = passwords[selectedTableIndex]!.isFavorite === 1;
		const newFavoriteState = !wasFavorite; // toggle to opposite state

		await currentVaultManager.toggleFavoritePassword(
			passwords[selectedTableIndex]?.id || 0,
			newFavoriteState,
		);
		// update favorite status in place (doesn't reorder list until next load)
		passwords[selectedTableIndex]!.isFavorite = newFavoriteState ? 1 : 0;
		showToast(wasFavorite ? 'password unfavorited' : 'password favorited');
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

	// calculate how many rows are visible in table (same logic as in table.tsx)
	const calculateVisibleRows = () => {
		if (terminalRows > 0) {
			// UI structure: border(2) + header(3) + table_header(2) + footer(3) + toast(1) + safety_margin(1)
			const uiOverhead = 12;
			return Math.max(3, terminalRows - uiOverhead);
		}
		return passwords.length; // fallback to showing all
	};

	// auto-scroll when selection changes
	useEffect(() => {
		const visibleRows = calculateVisibleRows();
		const shouldScroll = passwords.length > visibleRows;

		if (shouldScroll) {
			// when scrolling is active, we show visibleRows-1 data rows + 1 truncation row
			const visibleDataRows = visibleRows - 1;

			// if selected item is below visible area, scroll down
			if (selectedTableIndex >= scrollOffset + visibleDataRows) {
				setScrollOffset(selectedTableIndex - visibleDataRows + 1);
			}
			// if selected item is above visible area, scroll up
			else if (selectedTableIndex < scrollOffset) {
				setScrollOffset(selectedTableIndex);
			}
		}
	}, [selectedTableIndex, passwords.length, terminalRows, scrollOffset]);

	const title = selectedVault ? `Vault: ${selectedVault.name}` : 'Error';

	const {buffer, enableBuffer, clearBuffer} = useCustomInput((input, key) => {
		if (buffer.isActive && key.return) {
			if (isDeleting) {
				if (buffer.content.toLowerCase() === 'y') {
					// Perform deletion
					const passwordToDelete = passwords[selectedTableIndex];
					if (passwordToDelete && currentVaultManager) {
						currentVaultManager
							.deletePassword(passwordToDelete)
							.then(() => {
								showToast('Password deleted', ToastLineType.SUCCESS);
								// Refresh passwords list
								const fetchPasswords = async () => {
									if (!selectedVault || !currentVaultManager) return;
									try {
										const passwords = await currentVaultManager.getPasswords();
										const favorites = passwords.filter(p => p.isFavorite === 1);
										const nonFavorites = passwords.filter(
											p => p.isFavorite !== 1,
										);
										const sortedFavorites = favorites.sort(
											(a, b) => b.updatedAt - a.updatedAt,
										);
										const sortedNonFavorites = nonFavorites.sort(
											(a, b) => b.updatedAt - a.updatedAt,
										);
										const sortedPasswords = [
											...sortedFavorites,
											...sortedNonFavorites,
										];
										setPasswords(sortedPasswords);
										// Adjust selected index if necessary
										if (selectedTableIndex >= sortedPasswords.length) {
											const newIndex = Math.max(0, sortedPasswords.length - 1);
											setSelectedTableIndex(newIndex);
											// adjust scroll offset if needed
											const visibleRows = calculateVisibleRows();
											if (newIndex < scrollOffset) {
												setScrollOffset(Math.max(0, newIndex));
											}
										}
									} catch (error) {
										console.error('Failed to reload passwords:', error);
										showToast(
											'Failed to reload passwords',
											ToastLineType.ERROR,
										);
									}
								};
								fetchPasswords();
							})
							.catch(error => {
								console.error('Failed to delete password:', error);
								showToast('Failed to delete password', ToastLineType.ERROR);
							});
					}
				}
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
				navigateEnter(key, selectedControlIndex, controls);
			}
		}
	});

	// Enable buffer for deletion confirmation
	useEffect(() => {
		if (isDeleting) {
			enableBuffer(true, false, 1); // not hidden for confirmation text
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
					scrollOffset={scrollOffset}
				/>
			</Box>
			<Footer>
				<BufferLine
					buffer={buffer}
					label={isDeleting ? 'Confirm delete (y/n)' : 'Input'}
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
