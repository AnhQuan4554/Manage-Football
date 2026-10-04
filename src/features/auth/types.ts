export type AccountRole = "member" | "admin";

export type Account = {
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  status: string;
};
