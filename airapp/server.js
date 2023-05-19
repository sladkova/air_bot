import express from 'express'
import mongoose from 'mongoose'

const MONGODB_URI = "mongodb://localhost/airbotdb";

// Підключення до бази даних MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const AirModel = mongoose.model("airdata", {
  userId: Number,
  username: String,
  latitude: Number,
  longitude: Number,
  windSpeed: Number,
  windDirection: String,
  timestamp: { type: Date, default: Date.now },
});

db.on("error", console.error.bind(console, "Помилка з'єднання з базою даних:"));
db.once("open", () => {
  console.log("З'єднання з базою даних встановлено");
});

const app = express();
const port = 3001;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// API для отримання даних з бази даних
app.route("/api/airdata").get(async (req, res) => {
  try {
    const applications = await AirModel.find().exec();
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер Express запущено на порті ${port}`);
});
