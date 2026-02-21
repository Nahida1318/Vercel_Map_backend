const nodemailer = require("nodemailer");

// ✅ Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS, // your Gmail App Password (not regular password)
  },
});

// ✅ Function to send an email notification
const sendNotification = async (to, subject, text) => {
try {
    const mailOptions = {
    from: `"Incident Alert System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
} catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
}
};

module.exports = sendNotification;
