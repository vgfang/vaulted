import os from 'os';
import path from 'path';

export const expandPath = (filePath: string): string => {
	if (filePath.startsWith('~/')) {
		return path.join(os.homedir(), filePath.slice(2));
	}
	if (filePath === '~') {
		return os.homedir();
	}
	return filePath;
};
