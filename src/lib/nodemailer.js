const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, 
  secure: false, 
  auth: {
    user: 'arif20041221@gmail.com',
    pass: 'hufutnfmmvvapcec',
  },
});

const mailer = async ({ subject, html, to, text }) => {
  await transport.sendMail({
    from: process.env.nodemailer_email,
    subject: subject || 'testing',
    html: html || '<h1> send through api </h1>',
    to: to,
    text: text,
  });
};

module.exports = mailer;
