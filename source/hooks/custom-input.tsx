import {useInput} from 'ink';
import {useState} from 'react';
import {BUFFER_MAX_LENGTH} from '../utils/constants';

export interface TextBuffer {
	content: string;
	isActive: boolean;
	isHidden: boolean;
}

export const useCustomInput = (handler: (input: string, key: any) => void) => {
	const [buffer, setBuffer] = useState('');
	const [isBufferActive, setIsBufferActive] = useState(false);
	const [isBufferHidden, setIsBufferHidden] = useState(false);
	const [bufferMaxLength, setBufferMaxLength] = useState(BUFFER_MAX_LENGTH);

	useInput((input, key) => {
		if (input === 'q' && !isBufferActive) {
			process.stdout.write('\x1b[2J\x1b[H');
			process.exit(0);
		}

		if (isBufferActive) {
			if (key.escape) {
				clearBuffer();
				return;
			}
			if (key.backspace || key.delete) {
				setBuffer(prev => prev.slice(0, -1));
				return;
			}
			if (input && !key.ctrl && !key.meta) {
				setBuffer(prev => {
					const newBuffer = prev + input;
					return newBuffer.length <= bufferMaxLength ? newBuffer : prev;
				});
			}
			handler(input, key);
			return;
		}
		handler(input, key);
	});

	const enableBuffer = (
		enabled: boolean = false,
		hidden: boolean = false,
		maxLength?: number,
	) => {
		setBuffer('');
		setIsBufferActive(enabled);
		setIsBufferHidden(hidden);
		if (maxLength !== undefined) {
			setBufferMaxLength(maxLength);
		}
	};

	const clearBuffer = () => {
		setBuffer('');
		setIsBufferActive(false);
	};

	return {
		buffer: {
			content: buffer,
			isActive: isBufferActive,
			isHidden: isBufferHidden,
		} as TextBuffer,
		enableBuffer,
		clearBuffer,
		setIsBufferHidden,
	};
};
