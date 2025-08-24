import { VaultManager } from "./db/vault-manager";
import fs from "fs";

const listVaultFilePaths = async (vaultsPath: string) => {
  const files = fs.readdirSync(vaultsPath);
  return files.filter((file) => file.endsWith(".vault"));
};

export const listVaults = async (vaultsPath: string) => {
  const vaultFilePaths = await listVaultFilePaths(vaultsPath);

  const vaultPromises = vaultFilePaths.map(async (filePath) => {
    const fullPath = `${vaultsPath}/${filePath}`;
    const vaultManager = new VaultManager(fullPath);
    const metadata = await vaultManager.getMetadata();
    vaultManager.closeConnection();
    return metadata[0]; // getMetadata returns array, we want first item
  });

  return await Promise.all(vaultPromises);
};

export const createVault = async (
  filePath: string,
  name: string,
  description: string,
  enableTimestamps: boolean
) => {
  await VaultManager.createVault(filePath, name, description, enableTimestamps);
};

export { VaultManager };
