import { Notification, User } from '../models/index.js';
import { ROLES } from '../config/constants.js';
import { notifyUser } from '../websocket.js';
import { sendEmail } from './email.js';

export async function notifyUsers({ apartmentId, userIds, type, message, link }) {
  if (!userIds.length) return [];
  const notifications = userIds.map(userId => ({
    apartmentId,
    userId,
    type: type || 'info',
    message,
    link: link || '',
  }));
  const created = await Notification.insertMany(notifications);

  const usersWithEmail = await User.find({ _id: { $in: userIds }, email: { $ne: '' } }).select('email name');
  for (const u of usersWithEmail) {
    try {
      await sendEmail({
        to: u.email,
        subject: `[ACMS] ${type === 'notice' ? 'New Notice' : 'Notification'}: ${message}`,
        html: `<h2>${message}</h2><p>Hi ${u.name},</p><p>${message}</p>${link ? `<p><a href="http://localhost:5173${link}">View details</a></p>` : ''}`,
      });
    } catch { /* email sending is best-effort */ }
  }

  for (let i = 0; i < created.length; i++) {
    const n = created[i];
    notifyUser(n.userId, {
      type: 'notification',
      data: { _id: n._id, type: n.type, message: n.message, link: n.link, read: false, createdAt: n.createdAt },
    });
  }
  return created;
}

export async function notifyApartmentAdmins(apartmentId, message, link) {
  const admins = await User.find({ apartmentId, type: ROLES.APARTMENT_ADMIN }).select('_id');
  return notifyUsers({
    apartmentId,
    userIds: admins.map(a => a._id),
    message,
    link,
  });
}

export async function notifyCommitteeMembers(committeeId, apartmentId, message, link) {
  const members = await User.find({
    committeeId,
    type: { $in: [ROLES.COMMITTEE_HEAD, ROLES.COMMITTEE_MEMBER] },
  }).select('_id');
  return notifyUsers({ apartmentId, userIds: members.map(m => m._id), message, link });
}

export async function notifyResident(apartmentId, userId, message, link) {
  return notifyUsers({ apartmentId, userIds: [userId], message, link });
}
