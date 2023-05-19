const nodemailer = require('nodemailer');
const pug = require('pug');
const jiuce = require('juice');
const {convert} = require('html-to-text');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  return jiuce(html);
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = convert(html);
  const mailOptions = {
    from: 'Venish Patel <wanicepatel.1210@gmail.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text,
  };
  
  return await transporter.sendMail(mailOptions);
};