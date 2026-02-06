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

// Helper function to build the HTML email with questions
function buildQuestionsEmailHtml({ email, businessIdea, interviewSettingLabel, conversationStarter, questions }) {
 // Build question categories HTML
 let categoriesHtml = '';
 
 if (questions) {
  const categoryOrder = ['problemDiscovery', 'currentSolution', 'urgencyBudget', 'jobsToBeDone', 'decisionProcess'];
  const categoryColors = {
   problemDiscovery: { bg: '#f0fdf4', border: '#86efac', accent: '#16a34a' },
   currentSolution: { bg: '#eff6ff', border: '#93c5fd', accent: '#2563eb' },
   urgencyBudget: { bg: '#fefce8', border: '#fde047', accent: '#ca8a04' },
   jobsToBeDone: { bg: '#fdf4ff', border: '#d8b4fe', accent: '#9333ea' },
   decisionProcess: { bg: '#fff7ed', border: '#fdba74', accent: '#ea580c' }
  };
 
  for (const key of categoryOrder) {
   if (!questions[key]) continue;
   const cat = questions[key];
   const colors = categoryColors[key] || { bg: '#f9fafb', border: '#d1d5db', accent: '#4b5563' };
  
   let questionsListHtml = '';
   cat.questions.forEach((q, idx) => {
    questionsListHtml += `
     <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #f3f4f6;">
       <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td width="32" valign="top" style="color: ${colors.accent}; font-weight: 700; font-size: 14px; padding-top: 1px;">${idx + 1}.</td>
        <td style="color: #374151; font-size: 14px; line-height: 1.6;">${q}</td>
       </tr></table>
      </td>
     </tr>`;
   });
  
   categoriesHtml += `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px; border-radius: 8px; overflow: hidden; border: 1px solid ${colors.border};">
     <tr>
      <td style="background-color: ${colors.bg}; padding: 16px 20px; border-bottom: 1px solid ${colors.border};">
       <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #111827;">${cat.title}</h3>
       <p style="margin: 0; font-size: 13px; color: #6b7280;">${cat.description}</p>
      </td>
     </tr>
     ${questionsListHtml}
    </table>`;
  }
 }

 return `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Your Customer Discovery Interview Guide</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
 <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 32px 16px;">
  <tr>
   <td align="center">
    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
     
     <!-- Header -->
     <tr>
      <td style="background: linear-gradient(135deg, #0d9488, #059669); padding: 32px 40px; text-align: center;">
       <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Your Interview Guide is Ready</h1>
       <p style="margin: 0; font-size: 15px; color: #d1fae5;">Personalized questions generated by Gro</p>
      </td>
     </tr>

     <!-- Business Context -->
     <tr>
      <td style="padding: 28px 40px 0;">
       <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <tr>
         <td style="padding: 16px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Your Business Idea</p>
          <p style="margin: 0 0 12px 0; font-size: 15px; color: #111827; line-height: 1.5;">${businessIdea}</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280;"><strong>Interview Setting:</strong> ${interviewSettingLabel}</p>
         </td>
        </tr>
       </table>
      </td>
     </tr>

     <!-- Conversation Starter -->
     ${conversationStarter ? `
     <tr>
      <td style="padding: 24px 40px 0;">
       <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0;">
        <tr>
         <td style="padding: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #065f46;">Your Conversation Starter</p>
          <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6; font-style: italic;">${conversationStarter}</p>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #059669;">Tip: Customize the [bracketed] parts to match your specific situation</p>
         </td>
        </tr>
       </table>
      </td>
     </tr>
     ` : ''}

     <!-- Questions -->
     <tr>
      <td style="padding: 28px 40px 0;">
       <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #111827;">Your Discovery Questions</h2>
       ${categoriesHtml}
      </td>
     </tr>

     <!-- Pro Tips -->
     <tr>
      <td style="padding: 8px 40px 0;">
       <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
        <tr>
         <td style="padding: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #92400e;">Pro Interview Tips from Gro</h3>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
           <tr><td style="padding: 3px 0; font-size: 13px; color: #78350f; line-height: 1.5;">&bull; Listen more than you talk &mdash; aim for a 70/30 ratio</td></tr>
           <tr><td style="padding: 3px 0; font-size: 13px; color: #78350f; line-height: 1.5;">&bull; Never pitch your solution during discovery interviews</td></tr>
           <tr><td style="padding: 3px 0; font-size: 13px; color: #78350f; line-height: 1.5;">&bull; Ask &ldquo;Why?&rdquo; and &ldquo;Tell me more about that&rdquo; frequently</td></tr>
           <tr><td style="padding: 3px 0; font-size: 13px; color: #78350f; line-height: 1.5;">&bull; Take notes on emotions and energy levels, not just words</td></tr>
           <tr><td style="padding: 3px 0; font-size: 13px; color: #78350f; line-height: 1.5;">&bull; Interview 10-15 people before making big decisions</td></tr>
          </table>
         </td>
        </tr>
       </table>
      </td>
     </tr>

     <!-- CTA -->
     <tr>
      <td style="padding: 28px 40px;">
       <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 8px;">
        <tr>
         <td style="padding: 24px; text-align: center;">
          <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #111827;">Ready to Practice These Interviews?</p>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #4b5563;">Gro can role-play as different customer personas based on your business idea.</p>
          <a href="https://www.askgro.ai/" target="_blank" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #0d9488, #059669); color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px;">Practice with Gro</a>
         </td>
        </tr>
       </table>
      </td>
     </tr>

     <!-- Footer -->
     <tr>
      <td style="padding: 20px 40px 28px; border-top: 1px solid #e5e7eb; text-align: center;">
       <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af;">Generated by <a href="https://askgro.ai" style="color: #0d9488; text-decoration: none; font-weight: 600;">Gro</a> &mdash; Your AI Customer Discovery Coach</p>
       <p style="margin: 0; font-size: 11px; color: #d1d5db;">Helping founders validate ideas before they waste time, money, and ego.</p>
      </td>
     </tr>

    </table>
   </td>
  </tr>
 </table>
</body>
</html>`;
}

// Email capture endpoint
app.post('/subscribe', async (req, res) => {
 try {
 const { email, businessIdea, interviewSetting, interviewSettingLabel, conversationStarter, questions } = req.body;

 if (!email) {
 return res.status(400).json({ error: 'Email is required' });
 }

 // Send notification email to you via SendGrid
 const notificationMsg = {
 to: 'matt@askgro.ai',
 from: 'notifications@askgro.ai',
 subject: 'New Gro Question Generator Signup',
 html: `
 New User Registered via Gro Question Generator 
 Email: ${email} 
 Business Idea: ${businessIdea || 'Not provided'} 
 Timestamp: ${new Date().toISOString()} 
 
 
 This notification was sent automatically from the Gro Question Generator lead magnet. 
 `
 };

 // Send the user their personalized questions email
 const userEmailMsg = {
  to: email,
  from: 'notifications@askgro.ai',
  subject: `Your Customer Discovery Questions for: ${(businessIdea || '').substring(0, 60)}`,
  html: buildQuestionsEmailHtml({
   email,
   businessIdea: businessIdea || 'Not provided',
   interviewSettingLabel: interviewSettingLabel || interviewSetting || 'Not specified',
   conversationStarter: conversationStarter || '',
   questions: questions || null
  })
 };

 // Send both emails in parallel
 await Promise.all([
  sgMail.send(notificationMsg).then(() => {
   console.log('Notification email sent to matt@askgro.ai');
  }),
  sgMail.send(userEmailMsg).then(() => {
   console.log(`Questions email sent to ${email}`);
  })
 ]);

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
