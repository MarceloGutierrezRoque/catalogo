import TaskModel from './model.js';

const TaskController = {
  getAll: async (req, res) => {
    try {
      const userId = req.user.id;
      const tasks = await TaskModel.getAll(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  },

  getById: async (req, res) => {
    try {
      const userId = req.user.id;
      const task = await TaskModel.getById(req.params.id, userId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  },

  create: async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, description } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const task = await TaskModel.create({ title, description }, userId);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create task' });
    }
  },

  update: async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, description, completed } = req.body;
      const result = await TaskModel.update(req.params.id, { title, description, completed }, userId);
      
      if (!result) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      const task = await TaskModel.getById(req.params.id, userId);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  },

  delete: async (req, res) => {
    try {
      const userId = req.user.id;
      const deleted = await TaskModel.delete(req.params.id, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
};

export default TaskController;