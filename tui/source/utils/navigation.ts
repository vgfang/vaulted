import {Control} from '../components/controls';

// handle up and down on a linear menu
export const navigateUpDown = (
	input: string,
	key: any,
	selectedIndex: number,
	length: number,
	setSelectedIndex: (index: number) => void,
) => {
	if (input == 'k' || key.upArrow) {
		setSelectedIndex(Math.max(0, selectedIndex - 1));
	} else if (input == 'j' || key.downArrow) {
		setSelectedIndex(Math.min(length - 1, selectedIndex + 1));
	}
};

// handle left and right on a linear menu
export const navigateLeftRight = (
	input: string,
	key: any,
	selectedIndex: number,
	length: number,
	setSelectedIndex: (index: number) => void,
) => {
	if (input == 'h' || key.leftArrow) {
		setSelectedIndex(Math.max(0, selectedIndex - 1));
	} else if (input == 'l' || key.rightArrow) {
		setSelectedIndex(Math.min(length - 1, selectedIndex + 1));
	}
};

// handle enter on a linear menu
export const navigateEnter = (
	key: any,
	selectedIndex: number,
	controls: Control[],
) => {
	if (key.return) {
		controls[selectedIndex]?.func?.();
	}
};

export const shortcutControl = (
	input: string,
	controls: Control[],
): boolean => {
	const matchedControl = controls.find(control => control.shortcut === input);
	if (matchedControl?.func) {
		matchedControl.func();
		return true;
	}
	return false;
};
