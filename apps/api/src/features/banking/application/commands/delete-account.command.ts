import { AccountService } from "../services/account.service";

const accountService = new AccountService();

export async function deleteAccount(id: string) {
	return accountService.deleteAccount(id);
}
