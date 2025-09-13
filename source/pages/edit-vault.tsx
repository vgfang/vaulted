import {Box, Text} from 'ink';
import React, {useEffect, useState} from 'react';
import {useCustomInput} from '../hooks/custom-input';
import {Header} from '../components/header';
import {useScreen} from '../hooks/screen-context';
import {Control, Controls} from '../components/controls';
import {Footer} from '../components/footer';
import {
	navigateLeftRight,
	navigateUpDown,
	shortcutControl,
} from '../utils/navigation';
import {BufferLine} from '../components/buffer-line';
import {FormInputType, toggleCheckbox} from '../components/form-input';
import {Form, type FormInput} from '../components/form';

import {
	NAME_MIN_LENGTH,
	PASSWORD_MIN_LENGTH,
	NAME_MAX_LENGTH,
	PASSWORD_MAX_LENGTH,
	DESCRIPTION_MAX_LENGTH,
	CONTROL_WIDTH,
	VAULT_FILE_EXTENSION,
} from '../utils/constants';
import {Colors} from '../styles/colors';
import * as core from '../core/core';
import settings from '../../settings.json';
import {expandPath} from '../utils/path';
import {formatDateFriendly, hasValidTimestamp} from '../utils/dates';
import {generatePassword} from '@/utils/passwords';
import {ToastLineType} from '@/components/toast-line';

export const EditVault = () => {
	const {goBack, showToast} = useScreen();

	const [isLoading, setIsLoading] = useState(true);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		password: '',
		confirmPassword: '',
		enableTimestamps: true,
	});

	const {selectedVault} = useScreen();
	const [selectedControlIndex, setSelectedControlIndex] = useState(1);
	const [selectedFormIndex, setSelectedFormIndex] = useState(0);
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [initialFormData, setInitialFormData] = useState(formData);
	const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

	useEffect(() => {
		if (selectedVault) {
			const newFormData = {
				name: selectedVault.name,
				description: selectedVault.description ?? '',
				password: '',
				confirmPassword: '',
				enableTimestamps: selectedVault.updatedAt !== 0,
			};
			setFormData(newFormData);
			setInitialFormData(newFormData);
		} else {
			const newFormData = {
				name: '',
				description: '',
				password: '',
				confirmPassword: '',
				enableTimestamps: true,
			};
			setFormData(newFormData);
			setInitialFormData(newFormData);
		}
		// set loading to false after we've determined create vs edit mode
		setIsLoading(false);
	}, [selectedVault]);

	const updateFormField = (
		field: keyof typeof formData,
		value: string | boolean,
	) => {
		setFormData(prev => ({...prev, [field]: value}));
		if (isConfirmingDiscard) {
			clearBuffer();
			setIsConfirmingDiscard(false);
		}
	};

	useEffect(() => {
		const changed =
			JSON.stringify(formData) !== JSON.stringify(initialFormData);
		setHasUnsavedChanges(changed);
	}, [formData, initialFormData]);

	const formInputs: FormInput[] = [
		{
			label: 'Name',
			type: FormInputType.TEXT,
			value: formData.name,
			placeholder: 'Enter vault name',
			height: 1,
			onEdit: () => enableBuffer(true, false, NAME_MAX_LENGTH),
			onChange: (value: string) => {
				updateFormField('name', value);
			},
		},
		{
			label: 'Description',
			type: FormInputType.TEXT,
			value: formData.description,
			placeholder: 'Enter vault description',
			height: 2,
			onEdit: () => {
				setIsConfirmingDiscard(false);
				enableBuffer(true, false, DESCRIPTION_MAX_LENGTH);
			},
			onChange: (value: string) => {
				updateFormField('description', value);
			},
		},
		{
			label: 'Password',
			type: FormInputType.PASSWORD,
			value: formData.password,
			placeholder: selectedVault
				? 'Update vault password'
				: 'Enter vault password',
			height: 1,
			onEdit: () => {
				setIsConfirmingDiscard(false);
				enableBuffer(true, true, PASSWORD_MAX_LENGTH);
			},
			onChange: (value: string) => {
				updateFormField('password', value);
			},
		},
		{
			label: 'Confirm Password',
			type: FormInputType.PASSWORD,
			value: formData.confirmPassword,
			placeholder: 'Confirm vault password',
			height: 1,
			onEdit: () => {
				setIsConfirmingDiscard(false);
				enableBuffer(true, true, PASSWORD_MAX_LENGTH);
			},
			onChange: (value: string) => {
				updateFormField('confirmPassword', value);
			},
		},
		{
			label: 'Enable Timestamps',
			type: FormInputType.CHECKBOX,
			value: formData.enableTimestamps.toString(),
			onEdit: () => {
				updateFormField(
					'enableTimestamps',
					toggleCheckbox(formData.enableTimestamps),
				);
			},
		},
	];

	const handleBack = () => {
		if (!hasUnsavedChanges) {
			goBack();
			return;
		}
		showToast(
			"You have unsaved changes. Type 'y' to discard and go back",
			ToastLineType.WARNING,
		);
		setIsConfirmingDiscard(true);
		enableBuffer(true, false, 1);
	};

	const handleSave = async () => {
		if (!formData.name.trim()) {
			// TODO: show error
			showToast('name is required', ToastLineType.ERROR);
			return;
		}

		if (formData.name.trim().length < NAME_MIN_LENGTH) {
			// TODO: show error
			showToast(
				`name must be at least ${NAME_MIN_LENGTH} characters long`,
				ToastLineType.ERROR,
			);
			return;
		}

		if (formData.password.length < PASSWORD_MIN_LENGTH) {
			showToast(
				`password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
				ToastLineType.ERROR,
			);
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			// TODO: show error
			showToast('passwords do not match', ToastLineType.ERROR);
			return;
		}

		if (!selectedVault) {
			try {
				const expandedVaultsPath = expandPath(settings['vaults-path']);
				const filePath = `${expandedVaultsPath}/${formData.name}${VAULT_FILE_EXTENSION}`;

				await core.createVault(
					filePath,
					formData.name,
					formData.description,
					formData.enableTimestamps,
				);

				goBack();
				showToast('vault created', ToastLineType.SUCCESS);
				setHasUnsavedChanges(false);
			} catch (error) {
				showToast('failed to create vault', ToastLineType.ERROR);
			}
		} else {
			// try {
			// 	await currentVaultManager?.updateMetadata({
			// 		name: formData.name,
			// 		description: formData.description,
			// 		enableTimestamps: formData.enableTimestamps,
			// 	});
			// } catch (error) {
			// 	showToast('failed to update vault', ToastLineType.ERROR);
			// }
		}
	};

	const handleToggleView = () => {
		setPasswordVisible(prev => !prev);
	};
	const handleGeneratePassword = () => {
		const newPassword = generatePassword(16);
		updateFormField('password', newPassword);
		updateFormField('confirmPassword', newPassword);
	};

	const controls: Control[] = [
		{shortcut: 'b', tag: 'Back', func: handleBack},
		{shortcut: 'e', tag: 'Edit', func: () => {}},
		{shortcut: 'g', tag: 'Gen.', func: handleGeneratePassword},
		{shortcut: 'v', tag: 'View', func: handleToggleView},
		{shortcut: 's', tag: 'Save', func: handleSave},
	];

	const title = selectedVault
		? `Edit Vault: ${selectedVault.name}`
		: 'New Vault';

	const {buffer, enableBuffer, clearBuffer} = useCustomInput((input, key) => {
		if (isConfirmingDiscard && key.return) {
			if (buffer.content.toLowerCase() === 'y') {
				goBack();
			} else {
				clearBuffer();
				setIsConfirmingDiscard(false);
			}
			return;
		}
		if (buffer.isActive && key.return) {
			// save buffer content to current form field
			const currentInput = formInputs[selectedFormIndex];
			currentInput?.onChange?.(buffer.content);
			clearBuffer();
			// TODO: Handle validation errors if needed
			return;
		}
		if (!buffer.isActive) {
			if (input === 'e' || key.return) {
				formInputs[selectedFormIndex]?.onEdit?.();
				return;
			}
			navigateLeftRight(
				input,
				key,
				selectedControlIndex,
				controls.length,
				setSelectedControlIndex,
			);
			navigateUpDown(
				input,
				key,
				selectedFormIndex,
				formInputs.length,
				setSelectedFormIndex,
			);
			shortcutControl(input, controls);
		}
	});

	return (
		<Box flexDirection="column" flexGrow={1} alignItems="center">
			<Header title={title} />
			<Box
				flexDirection="column"
				flexGrow={1}
				alignItems="center"
				justifyContent="center"
				gap={2}
			>
				{!isLoading && (
					<Form
						inputs={formInputs}
						selectedIndex={selectedFormIndex}
						showPasswords={passwordVisible}
					/>
				)}
				{!isLoading && selectedVault && (
					<Box alignItems="flex-start" flexDirection="column">
						{hasValidTimestamp(selectedVault.updatedAt) && (
							<Text color={Colors.DEFAULT}>
								The vault contents were last updated{' '}
								{formatDateFriendly(selectedVault.updatedAt)}.
							</Text>
						)}
						{hasValidTimestamp(selectedVault.lastPasswordChange) && (
							<Text color={Colors.DEFAULT}>
								The vault password was last updated{' '}
								{formatDateFriendly(selectedVault.lastPasswordChange)}.
							</Text>
						)}
						{hasValidTimestamp(selectedVault.createdAt) && (
							<Text color={Colors.DEFAULT}>
								The vault was created on{' '}
								{formatDateFriendly(selectedVault.createdAt)}.
							</Text>
						)}
					</Box>
				)}
				{!isLoading && (
					<Box
						flexDirection="column"
						alignItems="center"
						gap={0}
						paddingTop={1}
					>
						<Text dimColor>Generate a strong password using 'g'</Text>
						<Text dimColor>
							Password settings are available in the settings menu
						</Text>
					</Box>
				)}
			</Box>
			<Footer>
				<BufferLine
					buffer={buffer}
					label={isConfirmingDiscard ? 'Confirm discard (y/n)' : 'Edit'}
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
