export interface User {
  uid: string;  // doc id only
  email: string;
  role: "viewer" | "ops" | "admin";
  permissions: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    manageUsers: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}