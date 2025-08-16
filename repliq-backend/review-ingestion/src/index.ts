import express from 'express';
import healthRoutes from './routes/healthRoutes';
import appleApiTestRoutes from './routes/appleApiTestRoutes';
import reviewIngestionRoutes from './routes/reviewIngestionRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { PORT } from './config';

const app = express();

app.use(express.json());
app.use(healthRoutes);
app.use(appleApiTestRoutes);
app.use('/api/reviews', reviewIngestionRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
