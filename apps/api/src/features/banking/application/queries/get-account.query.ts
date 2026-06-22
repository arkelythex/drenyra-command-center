import { AccountService } from "../services/account.service";

const accountService = new AccountService();

export async function getAccount(id: string) {
	return accountService.getAccount(id);
}
