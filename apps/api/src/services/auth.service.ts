import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AdminUser, IAdminUser } from "../models/AdminUser.js";
import { env } from "../config/env.js";
import { UnauthorizedError, NotFoundError } from "../utils/errors.js";

export async function login(email: string, password: string) {
  const admin = await AdminUser.findOne({ email: email.toLowerCase(), isActive: true }).select("+passwordHash");
  if (!admin) throw new UnauthorizedError("Invalid email or password");

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = jwt.sign(
    { sub: admin._id.toString(), email: admin.email, role: admin.role },
    env.JWT_SECRET,
    { expiresIn: 7 * 24 * 60 * 60 }
  );

  return {
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  };
}

export async function getAdminById(id: string): Promise<IAdminUser> {
  const admin = await AdminUser.findById(id);
  if (!admin) throw new NotFoundError("Admin not found");
  return admin;
}
