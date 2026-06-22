import { AccountService } from "../services/account.service";

const accountService = new AccountService();

export async function listAccounts(companyId: string) {
	return accountService.listAccounts(companyId);
}
