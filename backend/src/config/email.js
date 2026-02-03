require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter;

if (process.env.NODE_ENV === 'production') {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  // Development: use test account or mock
  transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
  });
}

module.exports = transporter;
