import * as StorageService from './storage';
import { Wallet } from '@common/constants';

export async function loadWalletPKs() {
    const pks = await StorageService.getItem(Wallet.STORAGE_KEY);
    return pks ? JSON.parse(pks) : [];
}

export async function saveWalletPKs(wallets) {
    const map = wallets.map(({ description, name, privateKey, almasFFS, type, mod, other }) => ({ description, name, privateKey, almasFFS, type, mod, other }));
    await StorageService.setItem(Wallet.STORAGE_KEY, JSON.stringify(map));
}