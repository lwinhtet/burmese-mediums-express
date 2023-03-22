const hbs = require('nodemailer-express-handlebars');
const nodemailer = require('nodemailer');
const path = require('path');

/* Create a transporter
   Define email options
   send email
*/
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.name;
    this.url = url;
    this.from = `Burmese Mediums <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
      // activate 'less secure app' option if u use gmail (but now we using mailtrap)
    });
  }

  async send(template, subject) {
    const handlebarOptions = {
      viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false
      },
      viewPath: path.resolve('./views/')
    };

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      template: 'email', // the name of the template file i.e email.handlebars
      // attachments: [{ filename: 'logo.png', path: './public/img/logo.png' }],
      context: {
        email: this.to, // person that u wanna send to
        resetURL: this.url // replace {{resetURL}} from email.handlebars with the val
      }
    };

    const transporter = this.newTransport().use(
      'compile',
      hbs(handlebarOptions)
    );

    await transporter.sendMail(mailOptions);
  }

  // sendWelcome() {
  //   this.send('email', 'Welcome to the Burmese Mediums Family');
  // }
  sendResetPassword() {
    this.send('email', 'Your password reset token (valid for 10 min)');
  }
};

// const sendEmail = async options => {
//   const handlebarOptions = {
//     viewEngine: {
//       partialsDir: path.resolve('./views/'),
//       defaultLayout: false
//     },
//     viewPath: path.resolve('./views/')
//   };

//   // use a template file with nodemailer
//   transporter.use('compile', hbs(handlebarOptions));

//   const mailOptions = {
//     from: 'Jonas Lwin <lwin@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     template: 'email', // the name of the template file i.e email.handlebars
//     // attachments: [{ filename: 'logo.png', path: './public/img/logo.png' }],
//     context: {
//       email: options.email,
//       resetURL: options.resetURL // replace {{resetURL}} from email.handlebars with the val
//     }
//   };

//   // trigger the sending of the E-mail
//   await transporter.sendMail(mailOptions);
// };
