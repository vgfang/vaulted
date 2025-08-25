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
import {FormInputType} from '../components/form-input';
import {Form, type FormInput} from '../components/form';
import {dummyValidator} from '../utils/input-validators';
import {
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

export const EditVault = () => {
	const {goBack} = useScreen();

	const [isLoading, setIsLoading] = useState(true);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		password: '',
		confirmPassword: '',
		enableTimestamps: true,
	});

	const {selectedVault} = useScreen();

	useEffect(() => {
		if (selectedVault) {
			setFormData({
				name: selectedVault.name,
				description: selectedVault.description ?? '',
				password: '',
				confirmPassword: '',
				enableTimestamps: selectedVault.updatedAt !== 0,
			});
		}
		// set loading to false after we've determined create vs edit mode
		setIsLoading(false);
	}, [selectedVault]);

	const updateFormField = (
		field: keyof typeof formData,
		value: string | boolean,
	) => {
		setFormData(prev => ({...prev, [field]: value}));
	};

	const formInputs: FormInput[] = [
		{
			label: 'Name',
			type: FormInputType.TEXT,
			value: formData.name,
			placeholder: 'Enter vault name',
			height: 1,
			onEdit: () => enableBuffer(true, false, NAME_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = dummyValidator(value);
				if (validation.valid) {
					updateFormField('name', value);
				}
				return validation;
			},
			validate: dummyValidator,
		},
		{
			label: 'Description',
			type: FormInputType.TEXT,
			value: formData.description,
			placeholder: 'Enter vault description',
			height: 2,
			onEdit: () => enableBuffer(true, false, DESCRIPTION_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = dummyValidator(value);
				if (validation.valid) {
					updateFormField('description', value);
				}
				return validation;
			},
			validate: dummyValidator,
		},
		{
			label: 'Password',
			type: FormInputType.PASSWORD,
			value: formData.password,
			placeholder: selectedVault
				? 'Enter vault password'
				: 'Update vault password?',
			height: 1,
			onEdit: () => enableBuffer(true, true, PASSWORD_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = dummyValidator(value);
				if (validation.valid) {
					updateFormField('password', value);
				}
				return validation;
			},
			validate: dummyValidator,
		},
		{
			label: 'Confirm Password',
			type: FormInputType.PASSWORD,
			value: formData.confirmPassword,
			placeholder: selectedVault
				? 'Enter vault password'
				: 'Update vault password?',
			height: 1,
			onEdit: () => enableBuffer(true, true, PASSWORD_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = dummyValidator(value);
				if (validation.valid) {
					updateFormField('confirmPassword', value);
				}
				return validation;
			},
			validate: dummyValidator,
		},
		{
			label: 'Enable Timestamps',
			type: FormInputType.CHECKBOX,
			value: formData.enableTimestamps.toString(),
		},
	];

	const handleSave = async () => {
		if (formData.password !== formData.confirmPassword) {
			return;
		}

		try {
			const expandedVaultsPath = expandPath(settings['vaults-path']);
			const filePath = `${expandedVaultsPath}/${formData.name}${VAULT_FILE_EXTENSION}`;

			await core.createVault(
				filePath,
				formData.name,
				formData.description,
				formData.enableTimestamps,
			);

			// success - go back to vaults list
			goBack();
		} catch (error) {
			// TODO: show error to user in UI
			console.error('Failed to create vault:', error);
		}
	};

	const controls: Control[] = [
		{shortcut: 'b', tag: 'Back', func: goBack},
		{shortcut: 'e', tag: 'Edit', func: () => {}},
		{shortcut: 'g', tag: 'Gen.', func: () => {}},
		{shortcut: 'u', tag: 'Unhide', func: () => {}},
		{shortcut: 's', tag: 'Save', func: handleSave},
	];
	const [selectedControlIndex, setSelectedControlIndex] = useState(1);
	const [selectedFormIndex, setSelectedFormIndex] = useState(0);

	const title = selectedVault
		? `Edit Vault: ${selectedVault.name}`
		: 'Create Vault';

	const {buffer, enableBuffer, clearBuffer} = useCustomInput((input, key) => {
		if (buffer.isActive && key.return) {
			// save buffer content to current form field
			const currentInput = formInputs[selectedFormIndex];
			if (currentInput?.attemptChange) {
				const result = currentInput.attemptChange(buffer.content);
				if (result.valid) {
					clearBuffer();
				}
				// TODO: Handle validation errors if needed
			}
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
					<Form inputs={formInputs} selectedIndex={selectedFormIndex} />
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
								The vault was created{' '}
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
				<BufferLine buffer={buffer} label="Edit" />
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
