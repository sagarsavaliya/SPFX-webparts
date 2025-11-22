export interface IEmployee {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  jobTitle: string;
  department: string;
  officeLocation: string;
  mail: string;
  businessPhones: string[];
  mobilePhone: string;
  userPrincipalName: string;
  photo?: string;
  managerId?: string;
  directReports?: string[];
}

export interface IAzureADGroup {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
}
