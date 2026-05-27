import express from 'express';
import cors from 'cors';
import corsConfig from './config/cors.js';
import taskRoutes from './tasks/route.js';
import userRoutes from './users/route.js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'yaml';

const swaggerDocument = yaml.parse(fs.readFileSync('./src/docs/swagger.yaml', 'utf8'));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors(corsConfig));
app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.json({ message: 'Task Manager API', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;