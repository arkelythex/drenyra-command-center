import { AccountService } from "../services/account.service";

const accountService = new AccountService();

export async function getBalance(accountId: string) {
	return accountService.getBalance(accountId);
}
