import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import pool from '../db.js';

let bot: TelegramBot | null = null;

export function initBot(): TelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set');
    return null;
  }

  bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'друг';
    const frontendUrl = process.env.FRONTEND_URL || 'https://gallery-way.ru/tma';
    const isHttps = frontendUrl.startsWith('https://');

    const welcomeText = 
      `Привет, ${firstName}! 👋\n\n` +
      `Добро пожаловать в Галерею Путь — пространство психологических выставок в темноте.\n\n` +
      (isHttps 
        ? `Нажмите кнопку ниже, чтобы записаться на выставку:` 
        : `🔧 *Режим разработки*\nFrontend: ${frontendUrl}\n\nДля записи нужен HTTPS URL.`);

    const options: TelegramBot.SendMessageOptions = { parse_mode: 'Markdown' };
    
    if (isHttps) {
      options.reply_markup = {
        inline_keyboard: [[
          { text: '📅 Записаться на выставку', web_app: { url: frontendUrl } }
        ]]
      };
    }

    await bot!.sendMessage(chatId, welcomeText, options);
  });

  bot.onText(/\/mybookings/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id;

    if (!telegramId) return;

    try {
      const result = await pool.query(
        `SELECT b.booking_date, b.booking_time, b.status, e.name
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN exhibitions e ON b.exhibition_id = e.id
         WHERE u.telegram_id = $1 AND b.status IN ('confirmed', 'completed')
         ORDER BY b.booking_date DESC, b.booking_time DESC
         LIMIT 5`,
        [telegramId]
      );

      if (result.rows.length === 0) {
        await bot!.sendMessage(chatId, 'У вас пока нет записей. Нажмите /start чтобы записаться на выставку.');
        return;
      }

      let message = '📋 *Ваши записи:*\n\n';
      result.rows.forEach((booking, index) => {
        const date = new Date(booking.booking_date).toLocaleDateString('ru-RU');
        const statusEmoji = booking.status === 'confirmed' ? '✅' : '✔️';
        message += `${index + 1}. ${statusEmoji} *${booking.name}*\n`;
        message += `   📅 ${date} в ${booking.booking_time.slice(0, 5)}\n\n`;
      });

      await bot!.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Get bookings failed:', error);
      await bot!.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
    }
  });

  console.log('Telegram bot initialized');
  return bot;
}

interface BookingDetails {
  exhibition_name: string;
  booking_date: string;
  booking_time: string;
}

export async function sendBookingConfirmation(telegramId: number, booking: BookingDetails): Promise<void> {
  if (!bot) {
    console.error('Bot not initialized');
    return;
  }

  const date = new Date(booking.booking_date).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const message = 
    `✅ *Бронирование подтверждено!*\n\n` +
    `🎭 *Выставка:* ${booking.exhibition_name}\n` +
    `📅 *Дата:* ${date}\n` +
    `⏰ *Время:* ${booking.booking_time}\n\n` +
    `📍 *Адрес:* СПб, ул. Гороховая 49 лит Б, пространство "SENO", 2 этаж\n` +
    `📞 *Контакт:* +7 981 124 5511\n\n` +
    `Ждём вас! Напоминание придёт за день до визита.`;

  try {
    await bot.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    console.log(`Confirmation sent to user ${telegramId}`);
  } catch (error) {
    console.error(`Failed to send confirmation to ${telegramId}:`, error);
  }
}

export async function sendReminder(telegramId: number, booking: BookingDetails): Promise<void> {
  if (!bot) return;

  const message = 
    `⏰ *Напоминание о визите!*\n\n` +
    `Завтра в *${booking.booking_time}* у вас запись на выставку *«${booking.exhibition_name}»*.\n\n` +
    `📍 *Адрес:* СПб, ул. Гороховая 49 лит Б, пространство "SENO", 2 этаж\n\n` +
    `Если планы изменились, позвоните: +7 981 124 5511`;

  try {
    await bot.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    console.log(`Reminder sent to user ${telegramId}`);
  } catch (error) {
    console.error(`Failed to send reminder to ${telegramId}:`, error);
  }
}

export function startReminderScheduler(): void {
  cron.schedule('0 10 * * *', async () => {
    console.log('Running reminder scheduler...');
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT b.id, b.booking_time, e.name as exhibition_name, u.telegram_id
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN exhibitions e ON b.exhibition_id = e.id
         WHERE b.booking_date = $1 AND b.status = 'confirmed' AND b.reminded_at IS NULL`,
        [tomorrowStr]
      );

      for (const booking of result.rows) {
        await sendReminder(booking.telegram_id, {
          exhibition_name: booking.exhibition_name,
          booking_date: tomorrowStr,
          booking_time: booking.booking_time.slice(0, 5)
        });

        await pool.query(
          'UPDATE bookings SET reminded_at = NOW() WHERE id = $1',
          [booking.id]
        );
      }

      console.log(`Sent ${result.rows.length} reminders`);
    } catch (error) {
      console.error('Reminder scheduler failed:', error);
    }
  }, {
    timezone: 'Europe/Moscow'
  });

  console.log('Reminder scheduler started (runs at 10:00 Moscow time)');
}

export { bot };
