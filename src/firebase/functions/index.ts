import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

admin.initializeApp();
const resend = new Resend(functions.config().resend.api_key);

export const sendInvitationEmail = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    const invitation = snap.data();
    const inviterSnapshot = await admin.firestore()
      .collection('users')
      .doc(invitation.invitedBy)
      .get();
    
    const inviter = inviterSnapshot.data();

    return resend.emails.send({
      from: 'Fifados <onboarding@resend.dev>',
      to: invitation.email,
      subject: '¡Te han invitado a Fifados!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1E3D8F;">¡Bienvenido a Fifados!</h1>
          <p>${inviter?.username || 'Un usuario'} te ha invitado a unirte a Fifados para registrar sus partidos.</p>
          <p>Para comenzar, haz clic en el siguiente enlace:</p>
          <a href="${functions.config().app.url}/register?email=${invitation.email}" 
             style="display: inline-block; background-color: #1E3D8F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Crear mi cuenta
          </a>
          <p style="color: #666; margin-top: 20px;">
            Si no esperabas esta invitación, puedes ignorar este correo.
          </p>
        </div>
      `
    });
  });
