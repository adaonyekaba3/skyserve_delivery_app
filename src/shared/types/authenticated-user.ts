import { Role } from './role.enum';

export interface AuthenticatedUser {
  sub: string;
  dbUserId: string;
  email: string;
  role: Role;
  restaurantIds: string[];
}
