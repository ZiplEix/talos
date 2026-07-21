import nodemailer from 'nodemailer';
import { marked } from 'marked';

export default {
  id: 'email-plugin',
  name: 'Gestionnaire d\'E-mails',
  description: 'Permet à l\'IA d\'envoyer des e-mails formatés.',
  configFields: [
    { key: 'smtp_host', label: 'Serveur SMTP', type: 'text', required: true },
    { key: 'smtp_port', label: 'Port SMTP', type: 'number', default: 587 },
    { key: 'smtp_user', label: 'Utilisateur SMTP', type: 'text' },
    { key: 'smtp_pass', label: 'Mot de passe SMTP', type: 'password' },
    { key: 'smtp_from', label: 'Adresse Expéditeur (From)', type: 'text', default: 'talos@app.com' },
    { key: 'smtp_secure', label: 'SSL/TLS Sécurisé', type: 'boolean', default: false }
  ],
  chatConfigFields: [
    { key: 'recipients', label: 'Destinataire(s) (e-mail)', type: 'text', placeholder: 'exemple@mail.com', required: true }
  ],
  initialize(config, context) {
    this.config = config;
    this.context = context;
  },
  tools: [
    {
      type: 'function',
      function: {
        name: 'SendEmail',
        description: "Envoie un e-mail avec un sujet et un corps de texte à des destinataires prédéfinis. Cet outil n'est utilisable que s'il a été explicitement autorisé.",
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: "L'objet / le sujet de l'e-mail."
            },
            body: {
              type: 'string',
              description: "Le corps du message (texte brut)."
            }
          },
          required: ['subject', 'body']
        }
      }
    }
  ],
  async executeTool(name, args, chatId) {
    if (name === 'SendEmail') {
      const { subject, body } = args;
      if (!subject || !body) {
        return 'error: parameters subject and body are required';
      }

      let recipients = '';

      if (chatId && this.context) {
        // Resolve recipient directly from chat-specific setting
        try {
          recipients = await this.context.getSetting(`chat_${chatId}_plugin_email-plugin_recipients`, '');
        } catch (e) {
          console.error('[Email Plugin] Error reading chat setting to resolve recipient:', e);
        }
      }

      if (!recipients) {
        return "error: Email recipients are not configured for this discussion/task. Please specify the recipient email addresses in the configuration.";
      }

      try {
        const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure } = this.config;

        if (!smtp_host) {
          return "error: SMTP is not configured. Please configure SMTP credentials in the Settings page to send real emails.";
        }

        const portNumber = parseInt(smtp_port, 10) || 587;

        const transporter = nodemailer.createTransport({
          host: smtp_host,
          port: portNumber,
          secure: smtp_secure,
          auth: smtp_user && smtp_pass ? {
            user: smtp_user,
            pass: smtp_pass
          } : undefined
        });

        // Parse text body as Markdown/HTML to support styled rich-text emails
        const htmlBody = await marked.parse(body);

        const info = await transporter.sendMail({
          from: smtp_from,
          to: recipients,
          subject: subject,
          text: body,
          html: htmlBody
        });

        console.log(`[Email Plugin] Email successfully sent: ${info.messageId}`);
        return `success: Email sent successfully to ${recipients} (MessageID: ${info.messageId})`;
      } catch (error) {
        console.error('Error in SendEmail plugin:', error);
        return `error: Failed to send email: ${error.message}`;
      }
    }
    return null;
  }
};
