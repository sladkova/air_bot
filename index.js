const {Telegraf, Markup} = require("telegraf"),
        BOT_TOKEN = "6120988185:AAHuvW1mxJver4KfHhLqk_HLTTh4nWod5nw";

        //2032874895:AAFdhZ_Qz5eaWFU2JQ6u4mkr9DaLFp0ig9A

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

const executedRequests = new Map();


bot.start((ctx) => {
  ctx.reply("Привіт, я допоможу відправити заявку про запах йоду в повітрі Запоріжжя. Натискай на велику кнопку під полем вводу. \n\n(кнопка доступна з мобільного пристрою)", 
    Markup
    .keyboard([
        Markup.button.locationRequest('🌬️ Відчуваю запах йоду.\n\n📧 Відправити заявку.', false, "bold")
    ])
   
    );
    ctx.replyWithPhoto({
      source: "pidkazka.jpeg"
    });
  
});


// bot.command("jod", ctx => {
//   const userId = ctx.from.id;
//   if (executedRequests.has(userId)) {
//     const lastExecutionTime = executedRequests.get(userId);
//     const currentTime = new Date().getTime();
//     const timeDifference = currentTime - lastExecutionTime;
//     const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));

//     if (hoursDifference < 1) {
//       const minutesDifference = Math.floor(timeDifference / (1000 * 60));
//       const remainingMinutes = 60 - minutesDifference;
//       ctx.reply(`Ви вже відправляли заявку. Спробуйте ще раз через ${remainingMinutes} хвилин.`);
//       return;
//     }
//   }

//   ctx.reply('Натискайте велику кнопку під полем вводу.\n(кнопка доступна з мобільного пристрою)', 
//     Markup
//     .keyboard([
//         Markup.button.locationRequest('🌬️ Відчуваю запах йоду.\n\n📧 Відправити заявку.', false, "bold")
//     ])
//   );

//   // Оновлення мітки часу для користувача
//   executedRequests.set(userId, new Date().getTime());
// });


bot.on('location', async (ctx) => {
  const userId = ctx.from.id;
  if (executedRequests.has(userId)) {
    const lastExecutionTime = executedRequests.get(userId);
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - lastExecutionTime;
    const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));

    if (hoursDifference < 1) {
      const minutesDifference = Math.floor(timeDifference / (1000 * 60));
      const remainingMinutes = 60 - minutesDifference;
      ctx.reply(`Ви вже відправляли заявку. Спробуйте ще раз через ${remainingMinutes} хвилин.`);
      return;
    }
  }
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
  executedRequests.set(userId, new Date().getTime());
});

// Функція для отримання напрямку вітру у вигляді тексту
function getWindDirection(degrees) {
  const directions = ['північний', 'північно-східний', 'східний', 'південно-східний', 'південний', 'південно-західний', 'західний', 'північно-західний'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

bot.launch();
