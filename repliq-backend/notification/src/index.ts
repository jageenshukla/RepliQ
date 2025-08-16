import express from 'express';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();
const app = express();
const port = process.env.PORT || 3004;

app.use(express.json());
app.use(healthRoutes);
app.use(notificationRoutes);

app.listen(port, () => {
  console.log(`notification listening on port ${port}`);
});
