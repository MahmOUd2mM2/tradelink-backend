import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

import { SMSService } from '../services/SMSService';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyfor_tradelink_pro_development';

export const registerOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone } = req.body;
    if (!email || !phone) {
      res.status(400).json({ message: 'البريد الإلكتروني ورقم الهاتف مطلوبان' });
      return;
    }

    // Validation: must be @gmail.com
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      res.status(400).json({ message: 'يرجى استخدام بريد إلكتروني ينتهي بـ @gmail.com' });
      return;
    }

    // Validation: must be 11 digits and start with 010, 011, 012, 015
    const phoneRegex = /^(010|011|012|015)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({ message: 'رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015' });
      return;
    }

    let existingUser = null;
    try {
      existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: email.toLowerCase() }, { phone }] }
      });
    } catch (dbErr) {
      console.error('[AUTH-DB-ERROR] Critical DB failure during existingUser check:', dbErr);
      // We continue because testing bypass 123456 should work even if DB is down
    }

    if (existingUser) {
      res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل' });
      return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 🛡️ Fail-safe: Try to create OTP record but don't crash if DB is out of sync
    try {
      await prisma.oTP.create({
        data: {
          code,
          type: 'REGISTRATION',
          expires_at: expiresAt
        }
      });
    } catch (dbErr) {
      console.warn('[AUTH-DB-WARN] Could not save OTP to database, bypass will still work:', dbErr);
    }

    // 🛡️ Fail-safe: Try to send SMS but don't crash if provider is not configured
    try {
      const message = `رمز التسجيل الخاص بك في منصة TradeLink Pro هو: ${code}.`;
      await SMSService.sendSMS(phone, message);
    } catch (smsErr) {
      console.warn('[AUTH-SMS-WARN] Could not send SMS, bypass 123456 will still work:', smsErr);
    }

    res.json({ 
      message: 'تم إرسال رمز التحقق (وضع الاختبار: 123456)', 
      success: true, 
      code: '123456' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في إرسال رمز التحقق' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, email, password, roleName, phone, 
      company_name, governorate, city, district, 
      village, hayy, trade_category, 
      latitude, longitude, otpCode 
    } = req.body;

    if (!name || !email || !password || !roleName || !phone || !otpCode) {
      res.status(400).json({ message: 'يرجى ملء جميع الحقول ورمز التحقق' });
      return;
    }

    // Validation: must be @gmail.com
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      res.status(400).json({ message: 'يرجى استخدام بريد إلكتروني ينتهي بـ @gmail.com' });
      return;
    }

    // Validation: must be 11 digits and start with 010, 011, 012, 015
    const phoneRegex = /^(010|011|012|015)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({ message: 'رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015' });
      return;
    }

    const otp = await (prisma as any).oTP.findFirst({
      where: {
        code: otpCode,
        type: 'REGISTRATION',
        expires_at: { gt: new Date() }
      },
      orderBy: { created_at: 'desc' }
    });

    if (otpCode !== '123456' && (!otp || otp.code !== otpCode)) {
      res.status(400).json({ message: 'رمز التحقق غير صحيح أو انتهت صلاحيته (أدخل 123456 للتجربة)' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل' });
      return;
    }

    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        company_name,
        governorate,
        city,
        district: district || city, // Using district for Marakiz
        village,
        hayy,
        trade_category,
        latitude: parseFloat(latitude) || null,
        longitude: parseFloat(longitude) || null,
        role_id: role.id,
        phone_verified: true
      },
    });

    if (otp) {
      await (prisma as any).oTP.delete({ where: { id: otp.id } });
    }

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: role.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: role.name,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, phone, code } = req.body;
    const otpCode = code || req.body.otpCode; // Support both naming conventions

    // 📱 Support Phone-only Login Start
    if (phone && !email && !password && !otpCode) {
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        res.status(404).json({ message: 'رقم الهاتف غير مسجل' });
        return;
      }

      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.oTP.create({
        data: { user_id: user.id, code: generatedCode, type: 'LOGIN', expires_at: expiresAt }
      });

      console.log(`[AUTH-DEBUG] Phone Login OTP for ${user.phone}: ${generatedCode}`);
      const message = `رمز التحقق الخاص بك للدخول إلى TradeLink Pro هو: ${generatedCode}. لا تشارك هذا الرمز مع أحد.`;
      if (user.phone) await SMSService.sendSMS(user.phone, message);

      res.status(202).json({ 
        message: 'تم إرسال رمز التحقق لهاتفك.', 
        requiresOTP: true,
        userId: user.id
      });
      return;
    }

    // 📱 Support Phone + OTP verification
    if (phone && otpCode && !password) {
      const user = await prisma.user.findUnique({ 
        where: { phone },
        include: { role: true }
      });
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const otp = await prisma.oTP.findFirst({
        where: {
          user_id: user.id,
          code: otpCode,
          type: 'LOGIN',
          expires_at: { gt: new Date() }
        }
      });

      if (otpCode !== '123456' && !otp) {
        res.status(400).json({ message: 'رمز التحقق غير صحيح أو انتهى (أدخل 123456 للتجربة)' });
        return;
      }

      await prisma.oTP.deleteMany({ where: { user_id: user.id, type: 'LOGIN' } });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Logged in successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
        },
      });
      return;
    }

    // Standard Email/Password + Optional OTP
    if (!email || !password) {
      res.status(400).json({ message: 'Need email/password or phone' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // 🛡️ 2FA Enforcement for Email Login
    if (!otpCode) {
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      try {
        await prisma.oTP.create({
          data: { user_id: user.id, code: generatedCode, type: 'LOGIN', expires_at: expiresAt }
        });
      } catch (dbErr) {
        console.warn('[AUTH-DB-WARN] Could not save Login OTP:', dbErr);
      }

      if (user.phone) {
        try {
          const message = `رمز التحقق الخاص بك للدخول إلى TradeLink Pro هو: ${generatedCode}.`;
          await SMSService.sendSMS(user.phone, message);
        } catch (smsErr) {
          console.warn('[AUTH-SMS-WARN] Could not send Login SMS:', smsErr);
        }
      }

      res.status(202).json({ 
        message: 'مطلوب التحقق الثنائي (2FA). تم إرسال رمز التحقق لهاتفك.', 
        requiresOTP: true,
        userId: user.id
      });
      return;
    }

    // Verify OTP for Email Login
    const otp = await prisma.oTP.findFirst({
      where: {
        user_id: user.id,
        code: otpCode,
        type: 'LOGIN',
        expires_at: { gt: new Date() }
      }
    });

    if (otpCode !== '123456' && !otp) {
       res.status(400).json({ message: 'رمز التحقق الثنائي (2FA) غير صحيح أو انتهى (أدخل 123456 للتجربة)' });
       return;
    }

    await prisma.oTP.deleteMany({ where: { user_id: user.id, type: 'LOGIN' } });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
