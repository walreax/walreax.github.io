import { Resend } from 'resend';

export default async function handler(req, res) {
  console.log('Contact form request received:', req.method);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    console.log('Validation failed - missing fields');
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if API key exists
  const apiKey = process.env.RESEND_API_KEY;
  console.log('API Key exists:', !!apiKey);
  console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');

  if (!apiKey) {
    console.error('RESEND_API_KEY not found in environment variables');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  console.log('Sending email with data:', { name, email, message });

  // Send email using Resend
  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev', // Using Resend's default verified sender
      to: 'jhaakshat33@gmail.com',
      subject: 'New Contact Form Submission',
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`
    });

    console.log('Email sent successfully:', result);
    res.status(200).json({ message: 'Message sent successfully!', id: result.id });
  } catch (error) {
    console.error('Email sending failed:', error);
    console.error('Error details:', error.message);
    return res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
}
