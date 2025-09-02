const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email capture endpoint
app.post('/api/capture-email', async (req, res) => {
  try {
    const { email, businessIdea } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Send notification email via SendGrid
    const notificationMsg = {
      to: 'matt@askgro.ai',
      from: 'notifications@askgro.ai', // This should be a verified sender in your SendGrid account
      subject: 'New Gro Question Generator Signup',
      html: `
        <h2>New User Registered via Gro Question Generator</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Business Idea:</strong> ${businessIdea || 'Not provided'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <hr>
        <p><em>This notification was sent automatically from the Gro Question Generator lead magnet.</em></p>
      `
    };

    await sgMail.send(notificationMsg);
    console.log('Notification email sent to matt@askgro.ai');

    // Add subscriber to Beehiiv
    const beehiivResponse = await axios.post(
      `https://api.beehiiv.com/v2/publications/${process.env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        email: email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: 'gro-question-generator',
        utm_medium: 'lead-magnet'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BEEHIIV_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Subscriber added to Beehiiv:', beehiivResponse.data);

    res.json({ 
      success: true, 
      message: 'Email captured successfully' 
    });

  } catch (error) {
    console.error('Error capturing email:', error);
    
    // Log specific error details
    if (error.response) {
      console.error('Response error:', error.response.data);
    }

    res.status(500).json({ 
      error: 'Failed to capture email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Required environment variables:');
  console.log('- SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✓' : '✗');
  console.log('- BEEHIIV_API_KEY:', process.env.BEEHIIV_API_KEY ? '✓' : '✗');
  console.log('- BEEHIIV_PUBLICATION_ID:', process.env.BEEHIIV_PUBLICATION_ID ? '✓' : '✗');
});