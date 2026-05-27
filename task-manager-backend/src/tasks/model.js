import prisma from '../prisma.js';

const TaskModel = {
  getAll: async (userId) => {
    return await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  getById: async (id, userId) => {
    return await prisma.task.findFirst({
      where: { id, userId }
    });
  },

  create: async (data, userId) => {
    return await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        completed: false,
        userId
      }
    });
  },

  update: async (id, data, userId) => {
    return await prisma.task.updateMany({
      where: { id, userId },
      data: {
        title: data.title,
        description: data.description,
        completed: data.completed
      }
    });
  },

  delete: async (id, userId) => {
    const result = await prisma.task.deleteMany({
      where: { id, userId }
    });
    return result.count > 0;
  }
};

export default TaskModel;