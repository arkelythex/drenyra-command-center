import type { CreateAccountDTO } from "../../../../types/banking.types";
import { AccountService } from "../services/account.service";

const accountService = new AccountService();

export async function createAccount(companyId: string, data: CreateAccountDTO) {
	return accountService.createAccount(companyId, data);
}
