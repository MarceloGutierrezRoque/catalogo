import UserModel from './model.js';
import bcrypt from 'bcryptjs';

const UserController = {
  register: async (req, res) => {
    try {
      const { name, lastname, email, password } = req.body;

      if (!name || !lastname || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await UserModel.create({
        name,
        lastname,
        email,
        password: hashedPassword
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        token: user.token
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to register user' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        token: user.token
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to login' });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await UserModel.findByToken(req.user.token);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        createdAt: user.createdAt
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
};

export default UserController;