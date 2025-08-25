import React, {useEffect, useState} from 'react';
import {Box} from 'ink';
import {useCustomInput} from '../hooks/custom-input';
import {Footer} from '../components/footer';
import {Header} from '../components/header';
import {Table} from '../components/table';
import {BufferLine} from '../components/buffer-line';
import {
	navigateEnter,
	navigateLeftRight,
	navigateUpDown,
	shortcutControl,
} from '../utils/navigation';
import {Screens, useScreen} from '../hooks/screen-context';
import {Controls, Control} from '../components/controls';
import {CONTROL_WIDTH, NAME_MAX_LENGTH} from '../utils/constants';
import {VaultMetadata} from '@/types';
import * as core from '../core/core';
import settings from '../../settings.json';
import {formatDate, hasValidTimestamp} from '../utils/dates';
import {expandPath} from '../utils/path';

export const Vaults = () => {
	const headerTitle = 'Vaults';

	const tableHeader = ['name', 'description', 'last updated'];

	const [vaultMetadataList, setVaultMetadataList] = useState<VaultMetadata[]>(
		[],
	);
	const [selectedTableIndex, setSelectedTableIndex] = useState(0);
	const [selectedControlIndex, setSelectedControlIndex] = useState(1);
	const [isDeleting, setIsDeleting] = useState(false);

	const {setCurrentScreen, goBack, setSelectedVault} = useScreen();

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

	const {buffer, enableBuffer} = useCustomInput((input, key) => {
		if (buffer.isActive) {
			if (key.return) {
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
				// reset delete state
				setIsDeleting(false);
				return;
			}
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
		setCurrentScreen(Screens.PASSWORD_MENU);
	};

	const handleEdit = () => {
		setCurrentScreen(Screens.EDIT_VAULT_MENU);
		setSelectedVault(vaultMetadataList[selectedTableIndex] ?? null);
	};

	const handleCreate = () => {
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

	// watch for when buffer becomes inactive (escape was pressed)
	useEffect(() => {
		if (!buffer.isActive) {
			setIsDeleting(false);
		}
	}, [buffer.isActive]);

	const controls: Control[] = [
		{shortcut: 'b', tag: 'Back', func: goBack},
		{shortcut: 'o', tag: 'Open', func: handleOpen},
		{shortcut: 'e', tag: 'Edit', func: handleEdit},
		{shortcut: 'c', tag: 'Create', func: handleCreate},
		{shortcut: 'd', tag: 'Delete', func: handleDelete},
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
				/>
			</Box>
			<Footer>
				<BufferLine
					buffer={buffer}
					label={isDeleting ? `Type vault name to delete` : 'Delete'}
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
