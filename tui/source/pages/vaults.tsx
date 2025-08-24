import React, {useEffect, useState} from 'react';
import {Box} from 'ink';
import {useCustomInput} from '../hooks/custom-input';
import {Footer} from '../components/footer';
import {Header} from '../components/header';
import {Table} from '../components/table';
import {
	navigateEnter,
	navigateLeftRight,
	navigateUpDown,
	shortcutControl,
} from '../utils/navigation';
import {Screens, useScreen} from '../hooks/screen-context';
import {Controls, Control} from '../components/controls';
import {CONTROL_WIDTH} from '../utils/constants';
import {VaultMetadata} from '@/types';
import * as core from '@core/core';
import settings from '../../settings.json';

export const Vaults = () => {
	const headerTitle = 'Vaults';

	const tableHeader = ['name', 'description', 'createdAt', 'updatedAt'];

	const [vaultMetadataList, setVaultMetadataList] = useState<VaultMetadata[]>(
		[],
	);
	const [selectedTableIndex, setSelectedTableIndex] = useState(0);
	const [selectedControlIndex, setSelectedControlIndex] = useState(1);

	const {setCurrentScreen, goBack, setSelectedVault} = useScreen();

	const vaultMetadataListToDisplay = (metadataList: VaultMetadata[]) => {
		return metadataList.map(metadata => ({
			name: metadata.name,
			description: metadata.description,
			updatedAt: metadata.updatedAt ?? 0,
		}));
	};

	useEffect(() => {
		const fetchVaults = async () => {
			try {
				const vaults = await core.listVaults(settings['vaults-path']);
				// filter out any null/undefined vaults and use full metadata
				const validVaults = vaults.filter(
					(vault): vault is VaultMetadata => vault != null,
				);
				setVaultMetadataList(validVaults);
			} catch (error) {
				console.error('Failed to load vaults:', error);
				setVaultMetadataList([]);
			}
		};
		fetchVaults();
	}, []);

	useCustomInput((input, key) => {
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

	const handleDelete = () => {};

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
				/>
			</Box>
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
