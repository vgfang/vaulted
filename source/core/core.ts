import {VaultManager} from './db/vault-manager';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {expandPath} from '../utils/path';

export const logToFile = (message: string) => {
	const logPath = './vaulted-debug.log';
	const timestamp = new Date().toISOString();
	fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
};

const listVaultFilePaths = async (vaultsPath: string) => {
	vaultsPath = os.homedir() + '/.vaults';
	logToFile('Looking for vaults in: ' + vaultsPath);
	logToFile('Directory exists: ' + fs.existsSync(vaultsPath));
	if (!fs.existsSync(vaultsPath)) {
		logToFile('Directory does not exist, returning empty array');
		return [];
	}
	const files = fs.readdirSync(vaultsPath);
	logToFile('All files in directory: ' + JSON.stringify(files));
	const vaultFiles = files.filter(file => file.endsWith('.vault'));
	logToFile('Vault files found: ' + JSON.stringify(vaultFiles));
	return vaultFiles;
};

export const listVaults = async (vaultsPath: string) => {
	const expandedVaultsPath = expandPath(vaultsPath);
	const vaultFilePaths = await listVaultFilePaths(expandedVaultsPath);

	logToFile(`Starting to process ${vaultFilePaths.length} vault files`);

	const vaultPromises = vaultFilePaths.map(async (filePath, index) => {
		try {
			const fullPath = `${expandedVaultsPath}/${filePath}`;
			logToFile(`Processing vault ${index + 1}: ${fullPath}`);

			const vaultManager = new VaultManager(fullPath);
			const metadata = await vaultManager.getMetadata();
			logToFile(`Got metadata for ${filePath}: ${JSON.stringify(metadata[0])}`);

			vaultManager.closeConnection();
			// expecting single row, add filePath to the metadata
			return {
				...metadata[0],
				filePath: fullPath,
			};
		} catch (error) {
			logToFile(`Error processing vault ${filePath}: ${error}`);
			return null;
		}
	});

	let results = await Promise.all(vaultPromises);
	results = results.filter(result => result !== null);
	results.sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0));
	logToFile(`Final results: ${JSON.stringify(results)}`);
	return results;
};

export const createVault = async (
	filePath: string,
	name: string,
	description: string,
	enableTimestamps: boolean,
) => {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, {recursive: true});
	}
	await VaultManager.createVault(filePath, name, description, enableTimestamps);
};

export {VaultManager};
