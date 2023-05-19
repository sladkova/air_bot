const {Telegraf, Markup} = require("telegraf"),
        BOT_TOKEN = "6120988185:AAHuvW1mxJver4KfHhLqk_HLTTh4nWod5nw";

const express = require("express");
const mongoose = require("mongoose");

const axios = require("axios");
const WEATHER_API_KEY = "7914d5a440960cfd5df3bd0388a7ad0f";
const MONGODB_URI = "mongodb://localhost/airbotdb";

const bot = new Telegraf(BOT_TOKEN);

// Підключення до бази даних MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Помилка з'єднання з базою даних:"));
db.once("open", () => {
  console.log("З'єднання з базою даних встановлено");
});

// Створення моделі для збереження заявок
const Application = mongoose.model("airdata", {
  userId: Number,
  username: String,
  latitude: Number,
  longitude: Number,
  windSpeed: Number,
  windDirection: String,
  timestamp: { type: Date, default: Date.now },
});

bot.start((ctx) => {
  ctx.reply("Привіт, я допоможу відправити заявку про запах йоду. Натискай на кнопку або обирай меню", 
    Markup
    .keyboard([
        Markup.button.locationRequest('Відчуваю запах йоду. Відправити заявку.')
    ])
    );
});

bot.command("jod", ctx => {
    ctx.reply('Надішліть свою геолокацію', {
        reply_markup: {
          resize_keyboard: true,
          one_time_keyboard: true,
          keyboard: [
            [
              {
                text: "Відправити геолокацію",
                request_location: true
              }
            ]
          ]
        }
      });
})


bot.on('location', async (ctx) => {
  const { latitude, longitude } = ctx.update.message.location;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`;
  try {
    const forecastResponse = await axios.get(forecastUrl);
    const forecastData = forecastResponse.data;
    const {speed, deg} = forecastData.wind;
    console.log(deg);
    const direction = getWindDirection(deg);
    let message = `На даний момент вітер дме з напрямку ${direction} зі швидкістю ${speed} м/c. \n`;
    message += `ви знаходитеся за координатами ${latitude} , ${longitude} \n`;
    message += `Дякуємо! Ваша заявка відправлена`;
    
    // Збереження заявки у базу даних
    const application = new Application({
      userId: ctx.from.id,
      username: ctx.from.username,
      latitude: latitude,
      longitude: longitude,
      windSpeed: speed,
      windDirection: deg,
    });
    await application.save();


    ctx.reply(message);
  } catch (error) {
    console.error(error);
    ctx.reply('Щось пішло не так! Спробуйте ще раз пізніше.');
  }
});

// Функція для отримання напрямку вітру у вигляді тексту
function getWindDirection(degrees) {
  const directions = ['північний', 'північно-східний', 'східний', 'південно-східний', 'південний', 'південно-західний', 'західний', 'північно-західний'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

bot.launch();
