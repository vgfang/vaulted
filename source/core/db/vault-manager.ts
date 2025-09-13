import {drizzle} from 'drizzle-orm/libsql';
import {desc} from 'drizzle-orm';
import {Client, createClient} from '@libsql/client';
import {metadataTable, passwordsTable, createTables} from './schema';
import {VaultMetadata, Password} from '../../types';
import {eq} from 'drizzle-orm';
import fs from 'fs';

class VaultManager {
	private client: Client;
	private db: ReturnType<typeof drizzle>;
	private currentlyLocked: boolean = true;
	private filePath: string;
	private vaultMetadata: VaultMetadata | null = null;

	constructor(filePath: string) {
		if (!fs.existsSync(filePath)) {
			throw new Error('File does not exist');
		}
		if (!filePath.endsWith('.vault')) {
			throw new Error('File is not a vault file');
		}

		this.filePath = filePath;
		this.client = createClient({url: `file:${filePath}`});
		this.db = drizzle({client: this.client});
	}

	static createVault = async (
		filePath: string,
		name: string,
		description: string,
		enableTimestamps: boolean,
	): Promise<void> => {
		const client = createClient({url: `file:${filePath}`});
		const db = drizzle({client});

		// create tables using centralized schema function
		await createTables(client);

		const enableTimestampsInt = Number(enableTimestamps);
		const vault = {
			name,
			description,
			enableTimestamps: enableTimestampsInt,
			createdAt: enableTimestampsInt ? Date.now() : null,
			updatedAt: enableTimestampsInt ? Date.now() : null,
			lastPasswordChange: enableTimestampsInt ? Date.now() : null,
		};

		await db.insert(metadataTable).values(vault);
		client.close();
	};

	getMetadata = async (): Promise<VaultMetadata[]> => {
		try {
			const metadata = await this.db.select().from(metadataTable);
			// Add filePath to each metadata record
			return metadata.map(meta => ({
				...meta,
				filePath: this.filePath,
			}));
		} catch (error) {
			throw new Error(
				`Failed to read vault metadata: ${error}. Vault may be corrupted.`,
			);
		}
	};

	getPasswords = async (): Promise<Password[]> => {
		if (this.currentlyLocked) {
			throw new Error('Vault is locked');
		}

		try {
			let passwords: Password[] = [];
			passwords = await this.db
				.select()
				.from(passwordsTable)
				.orderBy(desc(passwordsTable.updatedAt));
			return passwords;
		} catch (error) {
			throw new Error(
				`Failed to read passwords: ${error}. Vault database may be corrupted. Try creating a new vault or restoring from backup.`,
			);
		}
	};

	getCurrentlyLocked = (): boolean => {
		return this.currentlyLocked;
	};

	getFilePath = (): string => {
		return this.filePath;
	};

	unlockVault = async (_password: string): Promise<void> => {
		// TODO: verify password and decrypt
		this.currentlyLocked = false;

		// load metadata when unlocked
		const metadata = await this.getMetadata();
		this.vaultMetadata = metadata[0] || null;
	};

	lockVault = async (): Promise<void> => {
		// TODO: encrypt data
		this.currentlyLocked = true;
		this.vaultMetadata = null;
	};

	deleteVault = async (): Promise<void> => {
		if (!fs.existsSync(this.filePath)) {
			throw new Error('Vault file does not exist');
		}
		fs.unlinkSync(this.filePath);
	};

	closeConnection = (): void => {
		this.client.close();
	};

	// diagnostic and repair methods
	checkVaultIntegrity = async (): Promise<{
		isValid: boolean;
		error?: string;
	}> => {
		try {
			// try to read metadata
			await this.db.select().from(metadataTable);
			// try to count passwords
			await this.db.select().from(passwordsTable);
			return {isValid: true};
		} catch (error) {
			return {isValid: false, error: `Vault integrity check failed: ${error}`};
		}
	};

	// metadata crud
	updateMetadata = async (metadata: Partial<VaultMetadata>): Promise<void> => {
		const enableTimestamps =
			metadata.enableTimestamps ?? this.vaultMetadata?.enableTimestamps ?? 1;
		const updatedAt = enableTimestamps ? Date.now() : null;

		await this.db
			.update(metadataTable)
			.set({
				description: metadata.description ?? this.vaultMetadata?.description,
				name: metadata.name ?? this.vaultMetadata?.name,
				enableTimestamps: enableTimestamps,
				updatedAt: updatedAt,
			})
			.where(eq(metadataTable.id, this.vaultMetadata?.id || 0));

		if (enableTimestamps) {
			await this.updateUpdatedAt();
		}
	};

	updateVaultPassword = async (password: string): Promise<void> => {
		await this.db
			.update(metadataTable)
			.set({lastPasswordChange: Date.now()})
			.where(eq(metadataTable.id, this.vaultMetadata?.id || 0));
	};

	// when user updates vault password
	updateLastPasswordChange = async (): Promise<void> => {
		await this.db
			.update(metadataTable)
			.set({lastPasswordChange: Date.now()})
			.where(eq(metadataTable.id, this.vaultMetadata?.id || 0));
	};

	updateUpdatedAt = async (): Promise<void> => {
		await this.db
			.update(metadataTable)
			.set({updatedAt: Date.now()})
			.where(eq(metadataTable.id, this.vaultMetadata?.id || 0));
	};

	// password crud
	addPassword = async (
		name: string,
		email: string,
		password: string,
		description: string,
		isFavorite: boolean,
	): Promise<void> => {
		await this.db.insert(passwordsTable).values({
			name,
			email,
			password,
			description,
			isFavorite: isFavorite ? 1 : 0,
		});
		await this.updateUpdatedAt();
	};

	toggleFavoritePassword = async (
		id: number,
		newFavoriteState: boolean,
	): Promise<void> => {
		await this.db
			.update(passwordsTable)
			.set({isFavorite: newFavoriteState ? 1 : 0})
			.where(eq(passwordsTable.id, id));
		await this.updateUpdatedAt();
	};

	putPassword = async (password: Password): Promise<void> => {
		await this.db
			.update(passwordsTable)
			.set(password)
			.where(eq(passwordsTable.id, password.id));
		await this.updateUpdatedAt();
	};

	deletePassword = async (password: Password): Promise<void> => {
		await this.db
			.delete(passwordsTable)
			.where(eq(passwordsTable.id, password.id));
		await this.updateUpdatedAt();
	};
}

export {VaultManager};
