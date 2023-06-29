const {Telegraf, Markup} = require("telegraf"),
     //   BOT_TOKEN = "6120988185:AAHuvW1mxJver4KfHhLqk_HLTTh4nWod5nw"; //airbot
       BOT_TOKEN = "2032874895:AAFdhZ_Qz5eaWFU2JQ6u4mkr9DaLFp0ig9A"; //sladkova

const express = require("express");
const mongoose = require("mongoose");

const axios = require("axios");
const WEATHER_API_KEY = "7914d5a440960cfd5df3bd0388a7ad0f";
const MONGODB_URI = "mongodb://localhost/airbotdb";

const bot = new Telegraf(BOT_TOKEN);

const smells = ['йод', 'аміак', 'сірководень', 'сірка', 'металургійний гар', 'горілий пластик', 'хімія', 'гниль'];
let selectedSmell = '';

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
  kind_of_smell: String, 
  timestamp: { type: Date, default: Date.now },
});

const executedRequests = new Map();


bot.start((ctx) => {
  ctx.reply("Привіт, я допоможу відправити заявку про запах шкідливих речовин в повітрі Запоріжжя. Натискай на велику кнопку під полем вводу. \n\n(кнопка доступна з мобільного пристрою)", 
    Markup
    .keyboard([
        Markup.button.text('🌬️ Відчуваю запах шкідливих речовин.\n\n📧 Відправити заявку.', false, "bold")
    ])
   
    );
});

bot.hears(/🌬️ Відчуваю запах шкідливих речовин/, (ctx) => {
  ctx.reply('На що схожий цей сморід?', 
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Йод', 'smell iod'),
      Markup.button.callback('Аміак', 'smell ammonia'),
    ],
    [
      Markup.button.callback('Сірководень', 'smell hydrogen sulfide'),
      Markup.button.callback('Сірка', 'smell sulfur'),
    ],
    [
      Markup.button.callback('Металургійний гар', 'smell metallurgical fumes'),
      Markup.button.callback('Горілий пластик', 'smell burning plastic'),
    ],
    [
      Markup.button.callback('Хімія', 'smell chemicals'),
      Markup.button.callback('Гниль', 'smell decay'),
    ],
  ])
  );
});

bot.action(/smell (.+)/, async (ctx) => {
  const smell = ctx.match[1];
  await ctx.reply('Будь ласка, надішліть вашу локацію', Markup.keyboard([Markup.button.locationRequest('📍 Надіслати локацію і сформувати заявку')]).resize());
  selectedSmell = smell;
});

bot.hears(/.*/, (ctx) => {
  ctx.replyWithPhoto({
    source: "pidkazka.jpeg"
  });
})


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
      kind_of_smell: selectedSmell, 
    });
    await application.save();

   //ctx.reply(message);
   //ctx.editMessageReplyMarkup();

    ctx.reply(message,
      Markup.keyboard([
        Markup.button.text('🌬️ Відчуваю запах шкідливих речовин.\n\n📧 Відправити заявку.', false, "bold")
      ])
    );

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
