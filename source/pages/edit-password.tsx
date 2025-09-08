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
import {nameValidator, passwordValidator} from '../utils/input-validators';
import {
	NAME_MAX_LENGTH,
	PASSWORD_MAX_LENGTH,
	DESCRIPTION_MAX_LENGTH,
	CONTROL_WIDTH,
} from '../utils/constants';
import {generatePassword} from '../utils/passwords';

export const EditPassword = () => {
	const {goBack, selectedPassword, selectedVault, currentVaultManager} =
		useScreen();

	const [isLoading, setIsLoading] = useState(true);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		description: '',
		isFavorite: false,
	});

	const [selectedControlIndex, setSelectedControlIndex] = useState(1);
	const [selectedFormIndex, setSelectedFormIndex] = useState(0);
	const [passwordVisible, setPasswordVisible] = useState(false);

	useEffect(() => {
		if (selectedPassword) {
			setFormData({
				name: selectedPassword.name || '',
				email: selectedPassword.email || '',
				password: '',
				confirmPassword: '',
				description: selectedPassword.description || '',
				isFavorite: Boolean(selectedPassword.isFavorite),
			});
		}
		setIsLoading(false);
	}, [selectedPassword]);

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
			placeholder: 'Enter password name',
			height: 1,
			onEdit: () => enableBuffer(true, false, NAME_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = nameValidator(value);
				if (validation.valid) {
					updateFormField('name', value);
				}
				return validation;
			},
			validate: nameValidator,
		},
		{
			label: 'Email',
			type: FormInputType.TEXT,
			value: formData.email,
			placeholder: 'Enter email or username',
			height: 1,
			onEdit: () => enableBuffer(true, false, NAME_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = {valid: true};
				updateFormField('email', value);
				return validation;
			},
		},
		{
			label: 'Password',
			type: FormInputType.PASSWORD,
			value: formData.password,
			placeholder: selectedPassword ? 'Update password' : 'Enter password',
			height: 1,
			onEdit: () => enableBuffer(true, true, PASSWORD_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = passwordValidator(value);
				if (validation.valid) {
					updateFormField('password', value);
				}
				return validation;
			},
			validate: passwordValidator,
		},
		{
			label: 'Confirm Password',
			type: FormInputType.PASSWORD,
			value: formData.confirmPassword,
			placeholder: 'Confirm password',
			height: 1,
			onEdit: () => enableBuffer(true, true, PASSWORD_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = passwordValidator(value);
				if (validation.valid) {
					updateFormField('confirmPassword', value);
				}
				return validation;
			},
			validate: passwordValidator,
		},
		{
			label: 'Description',
			type: FormInputType.TEXT,
			value: formData.description,
			placeholder: 'Optional description',
			height: 2,
			onEdit: () => enableBuffer(true, false, DESCRIPTION_MAX_LENGTH),
			attemptChange: (value: string) => {
				const validation = {valid: true}; // no validation for description
				updateFormField('description', value);
				return validation;
			},
		},
		{
			label: 'Favorite',
			type: FormInputType.CHECKBOX,
			value: formData.isFavorite.toString(),
			onEdit: () => {
				updateFormField('isFavorite', toggleCheckbox(formData.isFavorite));
			},
		},
	];

	const handleSave = async () => {
		// validate required fields
		if (!formData.name.trim() || !formData.password.trim()) {
			// TODO: show error to user
			return;
		}

		// validate passwords match
		if (formData.password !== formData.confirmPassword) {
			// TODO: show error to user
			return;
		}

		try {
			if (!currentVaultManager) {
				console.error('No vault manager available');
				return;
			}

			await currentVaultManager.addPassword(
				formData.name,
				formData.email,
				formData.password,
				formData.description,
				formData.isFavorite,
			);

			// success - go back to passwords list
			goBack();
		} catch (error) {
			// TODO: show error to user in UI
			console.error('Failed to save password:', error);
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
		{shortcut: 'b', tag: 'Back', func: goBack},
		{shortcut: 'e', tag: 'Edit', func: () => {}},
		{shortcut: 'g', tag: 'Gen.', func: handleGeneratePassword},
		{shortcut: 'v', tag: 'View', func: handleToggleView},
		{shortcut: 's', tag: 'Save', func: handleSave},
	];

	const title = selectedPassword
		? `Edit Password for ${selectedVault?.name}: ${selectedPassword.name}`
		: `New Password for ${selectedVault?.name}`;

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
					<Form
						inputs={formInputs}
						selectedIndex={selectedFormIndex}
						showPasswords={passwordVisible}
					/>
				)}
				{!isLoading && (
					<Box
						flexDirection="column"
						alignItems="center"
						gap={0}
						paddingTop={1}
					>
						<Text dimColor>Generate a strong password using 'g'</Text>
						<Text dimColor>Toggle password visibility using 'v'</Text>
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
