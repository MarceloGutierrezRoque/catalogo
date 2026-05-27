import prisma from '../prisma.js';
import crypto from 'crypto';

const UserModel = {
  create: async (data) => {
    const token = crypto.randomBytes(32).toString('base64');
    return await prisma.user.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: data.password,
        token
      }
    });
  },

  findByEmail: async (email) => {
    return await prisma.user.findUnique({
      where: { email }
    });
  },

  findByToken: async (token) => {
    return await prisma.user.findUnique({
      where: { token }
    });
  },

  updateToken: async (id, token) => {
    return await prisma.user.update({
      where: { id },
      data: { token }
    });
  }
};

export default UserModel;