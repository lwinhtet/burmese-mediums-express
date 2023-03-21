const hbs = require('nodemailer-express-handlebars');
const nodemailer = require('nodemailer');
const path = require('path');

/* Create a transporter
   Define email options
   send email
*/

const sendEmail = async options => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    // activate 'less secure app' option if u use gmail (but now we using mailtrap)
  });

  const handlebarOptions = {
    viewEngine: {
      partialsDir: path.resolve('./views/'),
      defaultLayout: false
    },
    viewPath: path.resolve('./views/')
  };

  // use a template file with nodemailer
  transporter.use('compile', hbs(handlebarOptions));

  const mailOptions = {
    from: 'Jonas Lwin <lwin@gmail.com>',
    to: options.email,
    subject: options.subject,
    template: 'email', // the name of the template file i.e email.handlebars
    // attachments: [{ filename: 'logo.png', path: './public/img/logo.png' }],
    context: {
      email: options.email,
      resetURL: options.resetURL // replace {{resetURL}} from email.handlebars with the val
    }
  };

  // trigger the sending of the E-mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
