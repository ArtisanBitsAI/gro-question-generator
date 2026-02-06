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

// Generate AI-powered questions endpoint
app.post('/generate-questions', async (req, res) => {
  try {
    const { businessIdea, interviewSetting } = req.body;

    if (!businessIdea || !interviewSetting) {
      return res.status(400).json({ error: 'Business idea and interview setting are required' });
    }

    // Generate questions using Claude AI
    const prompt = `You are an expert customer discovery coach who has helped validate hundreds of startups. Analyze this business idea and generate highly specific, insightful interview questions.

Business idea: ${businessIdea}
Interview setting: ${interviewSetting}

Generate interview questions for these 5 critical categories. Each question must be:
1. Specific to THIS business idea (not generic)
2. Designed to uncover real insights (not yes/no questions)
3. Non-leading (doesn't assume there's a problem)
4. Conversational and natural for the setting
5. Focused on understanding their current reality, not hypotheticals

Return a JSON object with this exact structure:
{
  "problemDiscovery": {
    "title": "Problem Discovery",
    "description": "Uncover real pain points without leading the witness",
    "questions": [6 specific questions about their current challenges with this specific problem area]
  },
  "currentSolution": {
    "title": "Current Solutions & Alternatives", 
    "description": "Understand what they're doing now and why",
    "questions": [6 specific questions about their existing tools/processes for this need]
  },
  "urgencyBudget": {
    "title": "Urgency & Budget Reality",
    "description": "Validate if this is a 'hair on fire' problem worth paying for",
    "questions": [6 specific questions about priority, budget, and timeline]
  },
  "jobsToBeDone": {
    "title": "Jobs to Be Done",
    "description": "Understand the deeper motivations and desired outcomes",
    "questions": [6 specific questions about underlying goals and success metrics]
  },
  "decisionProcess": {
    "title": "Decision Making Process",
    "description": "Learn how they evaluate and buy solutions",
    "questions": [6 specific questions about their evaluation and purchasing process]
  }
}

Important: Make questions specifically about the actual problem space described in their business idea. Reference specific aspects of their idea in the questions.`;

    const response = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [
        { role: "user", content: prompt }
      ]
    }, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    });

    let responseText = response.data.content[0].text;
    
    // Clean up the response to extract JSON
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    try {
      const parsedQuestions = JSON.parse(responseText);
      res.json(parsedQuestions);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// Generate conversation starter endpoint
app.post('/generate-starter', async (req, res) => {
  try {
    const { businessIdea, interviewSetting } = req.body;

    if (!businessIdea || !interviewSetting) {
      return res.status(400).json({ error: 'Business idea and interview setting are required' });
    }

    const prompt = `You are an expert customer discovery coach. Generate a natural, conversational opening line for a customer interview.

Business idea: ${businessIdea}
Interview setting: ${interviewSetting}

Create a conversation starter that:
1. Is warm and non-threatening
2. Clearly states you're not selling anything
3. Shows genuine curiosity about their problems
4. Is appropriate for the setting (${interviewSetting === 'casual' || interviewSetting === 'conference' ? 'informal' : 'formal'})
5. Mentions specific aspects of their work related to the business idea
6. Takes 10-15 seconds to say out loud

Return ONLY the conversation starter in quotes, with [bracketed] placeholders for personalization.`;

    const response = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      messages: [
        { role: "user", content: prompt }
      ]
    }, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    });

    const starter = response.data.content[0].text.replace(/['"]/g, '').trim();
    res.json({ starter });

  } catch (error) {
    console.error('Error generating starter:', error);
    res.status(500).json({ error: 'Failed to generate conversation starter' });
  }
});

// Email capture endpoint
app.post('/subscribe', async (req, res) => {
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
  console.log('- CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✓' : '✗');
});
