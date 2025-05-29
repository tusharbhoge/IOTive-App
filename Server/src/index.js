import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import cron from 'node-cron';
import { checkAllClientsSchedules  } from './services/scheduler.js';

dotenv.config(); // Ensure .env is correctly loaded

const app = express();

// ✅ Enable CORS for all origins
app.use(cors({ origin: "*", credentials: true }));

// ✅ JSON Middleware
app.use(express.json()); 

app.use((req, res, next) => {
  console.log(`📩 Incoming Request: ${req.method} ${req.url}`);
  next();
});


// Run every minute
cron.schedule('* * * * *', async () => {
  const result = await checkAllClientsSchedules();
  console.log('Global schedule check result:', result);
});

console.log("🚀 Scheduler started");



// ✅ Mount admin routes correctly
app.use("/api", userRoutes); 



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 8000;
app.listen(PORT,"0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});




