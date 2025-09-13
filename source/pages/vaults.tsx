import {VaultMetadata} from '@/types';
import {Box} from 'ink';
import React, {useEffect, useState} from 'react';
import settings from '../../settings.json';
import {BufferLine} from '../components/buffer-line';
import {Control, Controls} from '../components/controls';
import {Footer} from '../components/footer';
import {Header} from '../components/header';
import {Table} from '../components/table';
import * as core from '../core/core';
import {useCustomInput} from '../hooks/custom-input';
import {Screens, useScreen} from '../hooks/screen-context';
import {
	CONTROL_WIDTH,
	NAME_MAX_LENGTH,
	PASSWORD_MAX_LENGTH,
} from '../utils/constants';
import {formatDate, hasValidTimestamp} from '../utils/dates';
import {
	navigateEnter,
	navigateLeftRight,
	navigateUpDown,
	shortcutControl,
} from '../utils/navigation';
import {expandPath} from '../utils/path';

export const Vaults = () => {
	const headerTitle = 'Vaults';

	const tableHeader = [
		{name: 'name'},
		{name: 'description'},
		{name: 'updated', minWidth: 10, maxWidth: 10},
	];

	const [vaultMetadataList, setVaultMetadataList] = useState<VaultMetadata[]>(
		[],
	);
	const [selectedTableIndex, setSelectedTableIndex] = useState(0);
	const [scrollOffset, setScrollOffset] = useState(0);
	const [selectedControlIndex, setSelectedControlIndex] = useState(1);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isEnteringPassword, setIsEnteringPassword] = useState(false);

	const {
		setCurrentScreen,
		goBack,
		setSelectedVault,
		setCurrentVaultManager,
		showToast,
		rows: terminalRows,
	} = useScreen();

	const performDelete = async (vault: VaultMetadata) => {
		try {
			const expandedVaultsPath = expandPath(settings['vaults-path']);
			const filePath = `${expandedVaultsPath}/${vault.name}.vault`;

			// create vault manager to delete the vault
			const vaultManager = new core.VaultManager(filePath);
			await vaultManager.deleteVault();
			vaultManager.closeConnection();
		} catch (error) {
			console.error('Failed to delete vault:', error);
			// TODO: show error to user and potentially revert UI changes
		}
	};

	const performOpenVault = async (vault: VaultMetadata, password: string) => {
		try {
			// Create vault manager and try to unlock with password
			const vaultManager = new core.VaultManager(vault.filePath);
			await vaultManager.unlockVault(password);

			// Store the unlocked vault manager in context for session use
			setCurrentVaultManager(vaultManager);
			setSelectedVault(vault);
			setCurrentScreen(Screens.PASSWORD_MENU);
		} catch (error) {
			console.error('Failed to open vault:', error);
			// TODO: show error to user (wrong password, etc.)
		}
	};

	const vaultMetadataListToDisplay = (metadataList: VaultMetadata[]) => {
		return metadataList.map(metadata => ({
			name: metadata.name,
			description: metadata.description,
			'last updated': hasValidTimestamp(metadata.updatedAt)
				? formatDate(metadata.updatedAt)
				: 'Not tracked',
		}));
	};

	useEffect(() => {
		const fetchVaults = async () => {
			try {
				const vaults = await core.listVaults(settings['vaults-path']);
				const validVaults = vaults.filter(
					(vault: any): vault is VaultMetadata => vault != null,
				);
				// sort by updatedAt descending
				validVaults.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
				setVaultMetadataList(validVaults);
			} catch (error) {
				console.error('Failed to load vaults:', error);
				setVaultMetadataList([]);
			}
		};
		fetchVaults();
	}, []);

	// calculate how many rows are visible in table (same logic as in table.tsx)
	const calculateVisibleRows = () => {
		if (terminalRows > 0) {
			// UI structure: border(2) + header(3) + table_header(2) + footer(3) + toast(1) + safety_margin(1)
			const uiOverhead = 12;
			return Math.max(3, terminalRows - uiOverhead);
		}
		return vaultMetadataList.length; // fallback to showing all
	};

	// auto-scroll when selection changes
	useEffect(() => {
		const visibleRows = calculateVisibleRows();
		const shouldScroll = vaultMetadataList.length > visibleRows;

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
	}, [
		selectedTableIndex,
		vaultMetadataList.length,
		terminalRows,
		scrollOffset,
	]);

	const {buffer, enableBuffer, clearBuffer} = useCustomInput((input, key) => {
		if (buffer.isActive && key.return) {
			if (isDeleting) {
				// check if the typed name matches the vault name
				const vaultToDelete = vaultMetadataList[selectedTableIndex];
				if (buffer.content === vaultToDelete?.name) {
					const updatedVaults = vaultMetadataList.filter(
						(_, idx) => idx !== selectedTableIndex,
					);
					setVaultMetadataList(updatedVaults);
					if (selectedTableIndex >= updatedVaults.length) {
						setSelectedTableIndex(Math.max(0, updatedVaults.length - 1));
					}
					performDelete(vaultToDelete);
				}
				// reset delete state - buffer will disable automatically
				setIsDeleting(false);
			} else if (isEnteringPassword) {
				// try to open vault with entered password
				const selectedVault = vaultMetadataList[selectedTableIndex];
				if (selectedVault && buffer.content) {
					performOpenVault(selectedVault, buffer.content);
				}
				// reset password entry state
				setIsEnteringPassword(false);
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
					vaultMetadataList.length,
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

	const handleOpen = () => {
		showToast('enter vault password');
		setIsEnteringPassword(true);
	};

	const handleEdit = () => {
		setCurrentScreen(Screens.EDIT_VAULT_MENU);
		setSelectedVault(vaultMetadataList[selectedTableIndex] ?? null);
	};

	const handleNew = () => {
		setCurrentScreen(Screens.EDIT_VAULT_MENU);
		setSelectedVault(null);
	};

	const handleDelete = () => {
		setIsDeleting(true);
	};

	useEffect(() => {
		if (isDeleting) {
			enableBuffer(true, false, NAME_MAX_LENGTH);
		}
	}, [isDeleting]);

	useEffect(() => {
		if (isEnteringPassword) {
			enableBuffer(true, true, PASSWORD_MAX_LENGTH); // hidden=true for password, longer length
		}
	}, [isEnteringPassword]);

	// watch for when buffer becomes inactive (escape was pressed)
	useEffect(() => {
		if (!buffer.isActive) {
			setIsDeleting(false);
			setIsEnteringPassword(false);
		}
	}, [buffer.isActive]);

	const controls: Control[] = [
		{shortcut: 'b', tag: 'Back', func: goBack},
		{shortcut: 'o', tag: 'Open', func: handleOpen},
		{shortcut: 'e', tag: 'Edit', func: handleEdit},
		{shortcut: 'n', tag: 'New', func: handleNew},
		{shortcut: 'd', tag: 'Del.', func: handleDelete},
	];

	return (
		<Box
			flexDirection="column"
			flexGrow={1}
			justifyContent="flex-start"
			alignItems="center"
		>
			<Header title={headerTitle} />
			<Box flexGrow={1}>
				<Table
					rows={vaultMetadataListToDisplay(vaultMetadataList)}
					header={tableHeader}
					selectedIndex={selectedTableIndex}
					isDeleting={isDeleting}
					scrollOffset={scrollOffset}
				/>
			</Box>
			<Footer>
				<BufferLine
					buffer={buffer}
					label={
						isDeleting
							? `Enter vault name to delete`
							: isEnteringPassword
							? `Enter vault password`
							: 'Input'
					}
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
