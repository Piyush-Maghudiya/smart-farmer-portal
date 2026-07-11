/**
 * Utility function to send verification email containing OTP.
 * Falls back to console printing in development if SMTP details are missing.
 * 
 * @param {string} email - Destination email address
 * @param {string} subject - Email subject
 * @param {string} otp - Generated OTP code
 */
export const sendEmail = async (email, subject, otp) => {
    const isSmtpConfigured = 
        process.env.SMTP_HOST && 
        process.env.SMTP_PORT && 
        process.env.SMTP_USER && 
        process.env.SMTP_PASS;

    if (isSmtpConfigured) {
        try {
            const nodemailer = (await import("nodemailer")).default;
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT, 10),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            const mailOptions = {
                from: process.env.SMTP_FROM || `"Smart Farmer Community" <no-reply@smartfarmer.com>`,
                to: email,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fcfcfc;">
                        <h2 style="color: #10b981; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Smart Farmer Portal</h2>
                        <p style="font-size: 16px; color: #333333; line-height: 1.5;">Hello,</p>
                        <p style="font-size: 16px; color: #333333; line-height: 1.5;">Thank you for registering at Smart Farmer Community. Please verify your email using the verification code below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #065f46; background-color: #ecfdf5; padding: 12px 28px; border-radius: 8px; border: 1px solid #a7f3d0; display: inline-block;">
                                ${otp}
                            </span>
                        </div>
                        <p style="font-size: 14px; color: #6b7280; text-align: center;">This code is valid for 10 minutes. Please do not share this OTP with anyone.</p>
                        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-top: 30px;" />
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Smart Farmer Community Portal &copy; 2026</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`[Email] Verification email sent successfully to ${email}`);
            return true;
        } catch (error) {
            console.error(`[Email Error] Failed to send email to ${email}:`, error.message);
            // Don't crash the server, fall back to console in case of delivery failure
        }
    }

    // Dev Fallback / Backup: Output OTP directly to terminal
    console.log("\n=======================================================");
    console.log("📨  DEVELOPMENT EMAIL OTP SIMULATION");
    console.log(`👤  To: ${email}`);
    console.log(`✉️   Subject: ${subject}`);
    console.log(`🔑  Verification Code (OTP): [ ${otp} ]`);
    console.log(`⏰  Expires In: 10 Minutes`);
    console.log("=======================================================\n");

    return true;
};
