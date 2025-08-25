import {drizzle} from 'drizzle-orm/libsql';
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
		const metadata = await this.db.select().from(metadataTable);
		return metadata;
	};

	getPasswords = async (
		searchString: string = '',
		isFavorite: boolean = false,
	): Promise<Password[]> => {
		if (this.currentlyLocked) {
			throw new Error('Vault is locked');
		}
		let passwords: Password[] = [];
		if (isFavorite) {
			passwords = await this.db
				.select()
				.from(passwordsTable)
				.where(eq(passwordsTable.isFavorite, 1));
		} else {
			passwords = await this.db.select().from(passwordsTable);
		}

		// TODO: fuzzy search library
		// if (searchString) {
		//   passwords = passwords.filter((password) => {
		//     return password.name.toLowerCase().includes(searchString.toLowerCase());
		//   });
		// }

		return passwords;
	};

	getCurrentlyLocked = (): boolean => {
		return this.currentlyLocked;
	};

	getFilePath = (): string => {
		return this.filePath;
	};

	unlockVault = async (password: string): Promise<void> => {
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

	// metadata crud
	updateMetadata = async (metadata: VaultMetadata): Promise<void> => {
		await this.db
			.update(metadataTable)
			.set({
				description: metadata.description,
				name: metadata.name,
				enableTimestamps: metadata.enableTimestamps,
			})
			.where(eq(metadataTable.id, this.vaultMetadata?.id || 0));

		if (metadata.enableTimestamps) {
			await this.updateUpdatedAt();
		}
	};

	// when user updates master password
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
	addPassword = async (password: Password): Promise<void> => {
		await this.db.insert(passwordsTable).values(password);
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
