import fs from 'fs';
import os from 'os';

const listVaultFilePaths = async (vaultsPath: string) => {
	const files = fs.readdirSync(vaultsPath);
	return files.filter(file => file.endsWith('.vault'));
};

listVaultFilePaths(os.homedir() + '/vaults').then(console.log);
