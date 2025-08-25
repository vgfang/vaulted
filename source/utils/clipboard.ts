import clipboardy from 'clipboardy';

export const copyToClipboard = (password: string) => {
	clipboardy.write(password);
};

export const clearClipboard = () => {
	clipboardy.write('');
};
