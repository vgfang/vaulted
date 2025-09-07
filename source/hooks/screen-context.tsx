import React, {createContext, useContext, useEffect, useState} from 'react';
import {useStdout} from 'ink';
import {MINIMUM_WIDTH, MINIMUM_HEIGHT} from '@/utils/constants';
import {VaultMetadata} from '@/types';
import {Password} from '@/types';
import {ToastLineType} from '@/components/toast-line';

const TOAST_DURATION = 3;

export enum Screens {
	TITLE = 'title',
	VAULT_MENU = 'vaults',
	EDIT_VAULT_MENU = 'edit-vault',
	PASSWORD_MENU = 'passwords',
	EDIT_PASSWORD_MENU = 'edit-password',
	SETTINGS = 'settings',
	HELP = 'help',
}

// Navigation hierarchy - defines where "back" should go for each screen
const SCREEN_NAVIGATION: Record<Screens, Screens | null> = {
	[Screens.TITLE]: null, // Title screen has no back
	[Screens.VAULT_MENU]: Screens.TITLE,
	[Screens.EDIT_VAULT_MENU]: Screens.VAULT_MENU,
	[Screens.PASSWORD_MENU]: Screens.VAULT_MENU,
	[Screens.EDIT_PASSWORD_MENU]: Screens.PASSWORD_MENU,
	[Screens.SETTINGS]: Screens.TITLE,
	[Screens.HELP]: Screens.TITLE,
};

interface Toast {
	type: ToastLineType;
	message: string;
	duration: number;
}

type ScreenContextType = {
	currentScreen: Screens;
	previousScreen: Screens | null;
	setCurrentScreen: (s: Screens) => void;
	goBack: () => void;
	cols: number;
	rows: number;
	selectedVault: VaultMetadata | null;
	setSelectedVault: (v: VaultMetadata | null) => void;
	isTooSmall: boolean;
	showError: (error: string) => void;
	timeUntilLockout: number;
	selectedPassword: Password | null;
	setSelectedPassword: (p: Password | null) => void;
	toast: Toast;
	setToast: (t: Toast) => void;
	showToast: (message: string, type?: ToastLineType, duration?: number) => void;
	clearToast: () => void;
};

export const ScreenContext = createContext<ScreenContextType | null>(null);

export const ScreenProvider: React.FC<{children: React.ReactNode}> = ({
	children,
}) => {
	const {stdout} = useStdout();
	const [cols, setCols] = useState<number>(stdout.columns);
	const [rows, setRows] = useState<number>(stdout.rows);

	// data states
	const [selectedVault, setSelectedVault] = useState<VaultMetadata | null>(
		null,
	);
	const [selectedPassword, setSelectedPassword] = useState<Password | null>(
		null,
	);
	const [currentScreen, setCurrentScreenState] = useState<Screens>(
		Screens.TITLE,
	);
	const [previousScreen, setPreviousScreen] = useState<Screens | null>(null);

	const [toast, setToast] = useState<Toast>({
		type: ToastLineType.INFO,
		message: '',
		duration: TOAST_DURATION,
	});

	// TODO: add time until lockout
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [timeUntilLockout, setTimeUntilLockout] = useState<number>(0); // TODO: implement lockout timer

	// Enhanced setCurrentScreen that tracks previous screen
	const setCurrentScreen = (newScreen: Screens) => {
		if (newScreen !== currentScreen) {
			setPreviousScreen(currentScreen);
			setCurrentScreenState(newScreen);
		}
	};

	// function to go back to previous screen using navigation map
	const goBack = () => {
		const backScreen = SCREEN_NAVIGATION[currentScreen];
		if (backScreen) {
			setPreviousScreen(currentScreen);
			setCurrentScreenState(backScreen);
		}
	};

	const isTooSmall = cols < MINIMUM_WIDTH || rows < MINIMUM_HEIGHT;

	useEffect(() => {
		const onResize = () => {
			setCols(stdout.columns);
			setRows(stdout.rows);
		};
		stdout.on('resize', onResize);
		return () => {
			stdout.off('resize', onResize);
		};
	}, [stdout]);

	// Auto-dismiss toast after duration
	useEffect(() => {
		if (toast.message.trim() !== '' && toast.duration > 0) {
			const timeoutId = setTimeout(() => {
				setToast({
					type: ToastLineType.INFO,
					message: '',
					duration: TOAST_DURATION,
				});
			}, toast.duration * 1000);

			return () => clearTimeout(timeoutId);
		}
		return undefined;
	}, [toast.message, toast.duration]);

	const showError = (error: string) => {
		// TODO: show error to user in UI via toast or notification
		console.error('Error:', error); // temporary logging
	};

	const showToast = (
		message: string,
		type: ToastLineType = ToastLineType.INFO,
		duration: number = TOAST_DURATION,
	) => {
		setToast({type, message, duration});
	};

	const clearToast = () => {
		setToast({type: ToastLineType.INFO, message: '', duration: TOAST_DURATION});
	};

	return (
		<ScreenContext.Provider
			value={{
				currentScreen,
				previousScreen,
				setCurrentScreen,
				goBack,
				cols,
				rows,
				selectedVault,
				setSelectedVault,
				isTooSmall,
				showError,
				timeUntilLockout,
				selectedPassword,
				setSelectedPassword,
				toast,
				setToast,
				showToast,
				clearToast,
			}}
		>
			{children}
		</ScreenContext.Provider>
	);
};

export const useScreen = () => {
	const ctx = useContext(ScreenContext);
	if (!ctx) throw new Error('useScreen must be inside ScreenProvider');
	return ctx;
};
