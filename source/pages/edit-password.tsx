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
	NAME_MAX_LENGTH,
	PASSWORD_MAX_LENGTH,
	DESCRIPTION_MAX_LENGTH,
	CONTROL_WIDTH,
	NAME_MIN_LENGTH,
	PASSWORD_MIN_LENGTH,
} from '../utils/constants';
import {generatePassword} from '../utils/passwords';
import {ToastLineType} from '../components/toast-line';

export const EditPassword = () => {
	const {
		goBack,
		selectedPassword,
		selectedVault,
		currentVaultManager,
		showToast,
	} = useScreen();

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
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [initialFormData, setInitialFormData] = useState(formData);
	const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

	useEffect(() => {
		if (selectedPassword) {
			const newFormData = {
				name: selectedPassword.name || '',
				email: selectedPassword.email || '',
				password: selectedPassword.password || '',
				confirmPassword: selectedPassword.password || '',
				description: selectedPassword.description || '',
				isFavorite: Boolean(selectedPassword.isFavorite),
			};
			setFormData(newFormData);
			setInitialFormData(newFormData);
		} else {
			const newFormData = {
				name: '',
				email: '',
				password: '',
				confirmPassword: '',
				description: '',
				isFavorite: false,
			};
			setFormData(newFormData);
			setInitialFormData(newFormData);
		}
		setIsLoading(false);
	}, [selectedPassword]);

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
			placeholder: 'Enter password name',
			height: 1,
			onEdit: () => {
				setIsConfirmingDiscard(false);
				enableBuffer(true, false, NAME_MAX_LENGTH);
			},
			onChange: (value: string) => {
				updateFormField('name', value);
			},
		},
		{
			label: 'Email',
			type: FormInputType.TEXT,
			value: formData.email,
			placeholder: 'Enter email or username',
			height: 1,
			onEdit: () => {
				setIsConfirmingDiscard(false);
				enableBuffer(true, false, NAME_MAX_LENGTH);
			},
			onChange: (value: string) => {
				updateFormField('email', value);
			},
		},
		{
			label: 'Password',
			type: FormInputType.PASSWORD,
			value: formData.password,
			placeholder: selectedPassword ? 'Update password' : 'Enter password',
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
			placeholder: 'Confirm password',
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
			label: 'Description',
			type: FormInputType.TEXT,
			value: formData.description,
			placeholder: 'Optional description',
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
			label: 'Favorite',
			type: FormInputType.CHECKBOX,
			value: formData.isFavorite.toString(),
			onEdit: () => {
				updateFormField('isFavorite', toggleCheckbox(formData.isFavorite));
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
		if (formData.name.trim().length < NAME_MIN_LENGTH) {
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
			showToast('passwords do not match', ToastLineType.ERROR);
			return;
		}

		try {
			if (!currentVaultManager) {
				showToast('no vault manager available', ToastLineType.ERROR);
				return;
			}
			if (selectedPassword) {
				const updatedPassword = {
					...selectedPassword,
					name: formData.name,
					email: formData.email,
					password: formData.password,
					description: formData.description,
					isFavorite: formData.isFavorite ? 1 : 0,
				};
				await currentVaultManager.putPassword(updatedPassword);
			} else {
				await currentVaultManager.addPassword(
					formData.name,
					formData.email,
					formData.password,
					formData.description,
					formData.isFavorite,
				);
			}
			goBack();
			showToast('Password saved', ToastLineType.SUCCESS);
			setHasUnsavedChanges(false);
		} catch (error) {
			showToast('Failed to save password', ToastLineType.ERROR);
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

	const title = selectedPassword
		? `Edit Password for ${selectedVault?.name}: ${selectedPassword.name}`
		: `New Password for ${selectedVault?.name}`;

	const {buffer, enableBuffer, clearBuffer} = useCustomInput((input, key) => {
		if (buffer.isActive && key.return && !isConfirmingDiscard) {
			// save buffer content to current form field
			const currentInput = formInputs[selectedFormIndex];
			currentInput?.onChange?.(buffer.content);
			clearBuffer();
			// TODO: Handle validation errors if needed
			return;
		}
		if (isConfirmingDiscard && key.return) {
			if (buffer.content.toLowerCase() === 'y') {
				goBack();
			} else {
				clearBuffer();
				setIsConfirmingDiscard(false);
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
